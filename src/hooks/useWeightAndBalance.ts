import { useState, useMemo, useEffect } from 'react';
import type { FlightLog, Aircraft, CalculationResult, UnitSystem } from '../types';
import { DEFAULT_AIRCRAFT } from '../data/c172s';
import { getPresetAircraft } from '../data/presets';

export const KG_TO_LBS = 2.20462;
export const GAL_TO_LITER = 3.78541;

export function useWeightAndBalance(initialFlight?: FlightLog) {
    const [flight, setFlight] = useState<FlightLog>(() => initialFlight || {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        aircraftId: DEFAULT_AIRCRAFT.id,
        pilotWeight: 170,
        frontPaxWeight: 0,
        rearPax1Weight: 0,
        rearPax2Weight: 0,
        baggage1Weight: 0,
        baggage2Weight: 0,
        fuelLeftGallons: DEFAULT_AIRCRAFT.fuelCapacity / 2,
        fuelRightGallons: DEFAULT_AIRCRAFT.fuelCapacity / 2,
        fuelGallons: DEFAULT_AIRCRAFT.fuelCapacity,
        fuelBurnGallons: 0,
        unitPreference: 'LBS'
    });

    const [aircraft, setAircraft] = useState<Aircraft>(() => {
        const stored = localStorage.getItem('c172_aircraft_config');

        // Standard C172 normal-category envelope used as fallback for custom aircraft
        const DEFAULT_CG_LIMITS = {
            fwd_low: { weight: 1950, arm: 35.0 },
            fwd_high: { weight: 2400, arm: 39.2 },
            aft: 47.3,
        };
        const DEFAULT_ENVELOPE_POINTS = [
            { x: 35.0, y: 1500 },
            { x: 35.0, y: 1950 },
            { x: 39.2, y: 2400 },
            { x: 47.3, y: 2400 },
            { x: 47.3, y: 1500 },
            { x: 35.0, y: 1500 },
        ];

        if (stored) {
            const parsed = JSON.parse(stored);
            // Refresh static data from preset if available to get latest envelope/limits
            const preset = getPresetAircraft(parsed.id);
            if (preset) {
                // FIX: Force update for 4X-CWZ if it has the old weight
                if (parsed.id === '4x-cwz' && parsed.basicEmptyWeight === 1500) {
                    return preset;
                }

                return {
                    ...parsed,
                    // Updates limits and envelope from code, keeping user's weight/arm edits if any
                    maxTakeoffWeight: preset.maxTakeoffWeight,
                    cgLimits: preset.cgLimits,
                    envelopePoints: preset.envelopePoints,
                    stationArms: preset.stationArms,
                    // basicEmptyWeight/Arm are preserved from 'parsed' as user might have customized them
                };
            }
            // Custom (non-preset) aircraft: ensure cgLimits and envelopePoints are valid
            const hasValidLimits = parsed.cgLimits?.fwd_high?.arm > 0 && parsed.cgLimits?.aft > 0;
            return {
                ...parsed,
                cgLimits: hasValidLimits ? parsed.cgLimits : DEFAULT_CG_LIMITS,
                envelopePoints: parsed.envelopePoints?.length ? parsed.envelopePoints : DEFAULT_ENVELOPE_POINTS,
            };
        }
        return DEFAULT_AIRCRAFT;
    });

    // Persist aircraft config changes
    useEffect(() => {
        localStorage.setItem('c172_aircraft_config', JSON.stringify(aircraft));
    }, [aircraft]);

    // Helper to convert display value to LBS for calculation
    const toLbs = (val: number, unit: UnitSystem) => unit === 'KG' ? val * KG_TO_LBS : val;

    const results = useMemo<CalculationResult>(() => {
        let totalWeight = aircraft.basicEmptyWeight;
        let totalMoment = aircraft.basicEmptyMoment;

        const weightsInLbs = {
            pilot: toLbs(flight.pilotWeight, flight.unitPreference),
            frontPax: toLbs(flight.frontPaxWeight, flight.unitPreference),
            rear1: toLbs(flight.rearPax1Weight, flight.unitPreference),
            rear2: toLbs(flight.rearPax2Weight, flight.unitPreference),
            bag1: toLbs(flight.baggage1Weight, flight.unitPreference),
            bag2: toLbs(flight.baggage2Weight, flight.unitPreference),
        };

        // Calculate Loads using aircraft-specific arms
        const arms = aircraft.stationArms;

        // Pilot & Front Pax
        const frontWeight = weightsInLbs.pilot + weightsInLbs.frontPax;
        totalWeight += frontWeight;
        totalMoment += frontWeight * arms.pilot_front_pax;

        // Rear Pax
        const rearWeightTotal = weightsInLbs.rear1 + weightsInLbs.rear2;
        totalWeight += rearWeightTotal;
        totalMoment += rearWeightTotal * arms.rear_pax;

        // Baggage 1
        totalWeight += weightsInLbs.bag1;
        totalMoment += weightsInLbs.bag1 * arms.baggage_1;

        // Baggage 2
        totalWeight += weightsInLbs.bag2;
        totalMoment += weightsInLbs.bag2 * arms.baggage_2;

        // Fuel (Use dual tanks, stored in Gallons)
        const totalFuelGallons = (flight.fuelLeftGallons || 0) + (flight.fuelRightGallons || 0);
        const fuelWeight = totalFuelGallons * aircraft.usableFuelPerGal;
        totalWeight += fuelWeight;
        totalMoment += fuelWeight * arms.fuel;

        // Fuel Burn Validation
        const isFuelBurnInvalid = (flight.fuelBurnGallons || 0) > totalFuelGallons;
        const actualFuelBurnGallons = Math.min(totalFuelGallons, flight.fuelBurnGallons || 0);
        const fuelBurnWeight = actualFuelBurnGallons * aircraft.usableFuelPerGal;

        // Landing Calculation
        const landingWeight = totalWeight - fuelBurnWeight;
        const landingMoment = totalMoment - (fuelBurnWeight * arms.fuel);
        const landingCG = landingWeight > 0 ? landingMoment / landingWeight : 0;

        const cg = totalWeight > 0 ? totalMoment / totalWeight : 0;

        // Check Limits using aircraft-specific constraints
        let status: CalculationResult['status'] = 'OK';

        // Interpolate Forward CG Limit
        let minFwdCG = aircraft.cgLimits.fwd_high.arm;
        const maxAftCG = aircraft.cgLimits.aft;

        if (aircraft.cgLimits.fwd_low) {
            const low = aircraft.cgLimits.fwd_low;
            const high = aircraft.cgLimits.fwd_high;
            if (totalWeight <= low.weight) {
                minFwdCG = low.arm;
            } else if (totalWeight >= high.weight) {
                minFwdCG = high.arm;
            } else {
                // Linear interpolation
                const weightRange = high.weight - low.weight;
                const armRange = high.arm - low.arm;
                minFwdCG = low.arm + (armRange / weightRange) * (totalWeight - low.weight);
            }
        }

        if (totalWeight > aircraft.maxTakeoffWeight) {
            status = 'OVERWEIGHT';
        } else if (cg < minFwdCG) {
            status = 'FWD_CG';
        } else if (cg > maxAftCG) {
            status = 'AFT_CG';
        }

        // Landing Limits Interpolation
        let landingMinFwdCG = aircraft.cgLimits.fwd_high.arm;
        if (aircraft.cgLimits.fwd_low) {
            const low = aircraft.cgLimits.fwd_low;
            const high = aircraft.cgLimits.fwd_high;
            if (landingWeight <= low.weight) {
                landingMinFwdCG = low.arm;
            } else if (landingWeight >= high.weight) {
                landingMinFwdCG = high.arm;
            } else {
                const weightRange = high.weight - low.weight;
                const armRange = high.arm - low.arm;
                landingMinFwdCG = low.arm + (armRange / weightRange) * (landingWeight - low.weight);
            }
        }

        let landingStatus: CalculationResult['status'] = 'OK';
        if (landingWeight > aircraft.maxTakeoffWeight) landingStatus = 'OVERWEIGHT';
        else if (landingCG < landingMinFwdCG) landingStatus = 'FWD_CG';
        else if (landingCG > maxAftCG) landingStatus = 'AFT_CG';

        // Station Specific Warnings (Structural Limits)
        const stationWarnings = {
            baggage1: weightsInLbs.bag1 > aircraft.maxBaggage1Weight,
            baggage2: weightsInLbs.bag2 > aircraft.maxBaggage2Weight,
            totalBaggage: (weightsInLbs.bag1 + weightsInLbs.bag2) > aircraft.maxTotalBaggageWeight,
            frontSeats: (weightsInLbs.pilot + weightsInLbs.frontPax) > (aircraft.maxFrontSeatWeight || 400),
            rearSeats: (weightsInLbs.rear1 + weightsInLbs.rear2) > (aircraft.maxRearSeatWeight || 400),
            fuelCapacity: totalFuelGallons > (aircraft.fuelCapacity + 0.01)
        };

        return {
            totalWeight,
            totalMoment,
            cg,
            isWithinLimits: status === 'OK' &&
                !stationWarnings.baggage1 &&
                !stationWarnings.baggage2 &&
                !stationWarnings.totalBaggage &&
                !stationWarnings.frontSeats &&
                !stationWarnings.rearSeats &&
                !stationWarnings.fuelCapacity,
            status,
            landingWeight,
            landingMoment,
            landingCG,
            fuelBurnWeight,
            limits: {
                takeoff: { min: minFwdCG, max: maxAftCG },
                landing: { min: landingMinFwdCG, max: maxAftCG }
            },
            landingStatus,
            isFuelBurnInvalid,
            totalFuelGallons,
            stationWarnings
        };

    }, [flight, aircraft]);



    return { flight, setFlight, aircraft, setAircraft, results };
}
