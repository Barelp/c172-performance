import type { Aircraft } from '../types';

export const PRESET_AIRCRAFT: Record<string, Aircraft> = {
    '4x-cdo': {
        id: '4x-cdo',
        tailNumber: '4X-CDO',
        basicEmptyWeight: 1573.0,
        basicEmptyMoment: 1573.0 * 42.28,
        emptyWeightArm: 42.28,
        fuelCapacity: 60.0,
        usableFuelPerGal: 6.0,
        datumLocation: 'Lower portion of front face of firewall',
        maxBaggage1Weight: 120,
        maxBaggage2Weight: 50,
        maxTotalBaggageWeight: 120,
        maxFrontSeatWeight: 400,
        maxRearSeatWeight: 400,
        maxTakeoffWeight: 2550,
        stationArms: {
            pilot_front_pax: 37.0,
            rear_pax: 73.0,
            baggage_1: 95.0,
            baggage_2: 123.0,
            fuel: 48.0,
        },
        cgLimits: {
            fwd_low: { weight: 1500, arm: 35.0 },
            fwd_high: { weight: 2550, arm: 39.6 },
            aft: 47.3,
        },
        envelopePoints: [
            { x: 35.0, y: 1500 },
            { x: 35.0, y: 1960 },
            { x: 39.6, y: 2550 },
            { x: 47.3, y: 2550 },
            { x: 47.3, y: 1500 },
            { x: 35.0, y: 1500 }
        ],
    },
    '4x-cdj': {
        id: '4x-cdj',
        tailNumber: '4X-CDJ',
        basicEmptyWeight: 1512.0,
        basicEmptyMoment: 1512.0 * 39.16,
        emptyWeightArm: 39.16,
        fuelCapacity: 40.0,
        usableFuelPerGal: 6.0,
        datumLocation: 'Lower portion of front face of firewall',
        maxBaggage1Weight: 120,
        maxBaggage2Weight: 50,
        maxTotalBaggageWeight: 120,
        maxFrontSeatWeight: 400,
        maxRearSeatWeight: 400,
        maxTakeoffWeight: 2300,
        stationArms: {
            pilot_front_pax: 37.0,
            rear_pax: 73.0,
            baggage_1: 95.0,
            baggage_2: 123.0,
            fuel: 48.0,
        },
        cgLimits: {
            fwd_low: { weight: 1950, arm: 35.0 },
            fwd_high: { weight: 2300, arm: 35.0 }, // CDJ shows fixed 35.0-47.3 bound in screenshot
            aft: 47.3,
        },
    },
    '4x-cgi': {
        id: '4x-cgi',
        tailNumber: '4X-CGI',
        basicEmptyWeight: 1553.0,
        basicEmptyMoment: 64703.51,
        emptyWeightArm: 41.67,
        fuelCapacity: 40.0,
        usableFuelPerGal: 6.0,
        datumLocation: 'Lower portion of front face of firewall',
        maxBaggage1Weight: 120,
        maxBaggage2Weight: 50,
        maxTotalBaggageWeight: 120,
        maxFrontSeatWeight: 400,
        maxRearSeatWeight: 400,
        maxTakeoffWeight: 2300,
        stationArms: {
            pilot_front_pax: 37.0,
            rear_pax: 73.0,
            baggage_1: 95.0,
            baggage_2: 123.0,
            fuel: 48.0,
        },
        cgLimits: {
            fwd_low: { weight: 1500, arm: 35.0 },
            fwd_high: { weight: 2300, arm: 39.6 },
            aft: 47.3,
        },
        envelopePoints: [
            { x: 35.0, y: 1500 },
            { x: 35.0, y: 1960 },
            { x: 39.6, y: 2300 },
            { x: 47.3, y: 2300 },
            { x: 47.3, y: 1500 },
            { x: 35.0, y: 1500 }
        ],
    },
    '4x-chl': {
        id: '4x-chl',
        tailNumber: '4X-CHL',
        basicEmptyWeight: 1635.0,
        basicEmptyMoment: 68179.5,
        emptyWeightArm: 41.7,
        fuelCapacity: 40.0,
        usableFuelPerGal: 6.0,
        datumLocation: 'Lower portion of front face of firewall',
        maxBaggage1Weight: 76,
        maxBaggage2Weight: 50,
        maxTotalBaggageWeight: 120,
        maxFrontSeatWeight: 400,
        maxRearSeatWeight: 400,
        maxTakeoffWeight: 2400,
        stationArms: {
            pilot_front_pax: 37.0,
            rear_pax: 73.0,
            baggage_1: 95.0,
            baggage_2: 123.0,
            fuel: 48.0,
        },
        cgLimits: {
            fwd_low: { weight: 1950, arm: 35.0 },
            fwd_high: { weight: 2400, arm: 39.2 },
            aft: 47.3,
        },
    },
    '4x-cwz': {
        id: '4x-cwz',
        tailNumber: '4X-CWZ',
        basicEmptyWeight: 1502.0,
        basicEmptyMoment: 57827.0,
        emptyWeightArm: 38.5,
        fuelCapacity: 40.0,
        usableFuelPerGal: 6.0,
        datumLocation: 'Lower portion of front face of firewall',
        maxBaggage1Weight: 120,
        maxBaggage2Weight: 50,
        maxTotalBaggageWeight: 120,
        maxFrontSeatWeight: 400,
        maxRearSeatWeight: 400,
        maxTakeoffWeight: 2550,
        stationArms: {
            pilot_front_pax: 37.0,
            rear_pax: 73.0,
            baggage_1: 95.0,
            baggage_2: 123.0,
            fuel: 48.0,
        },
        cgLimits: {
            fwd_low: { weight: 1500, arm: 35.0 },
            fwd_high: { weight: 2550, arm: 39.6 },
            aft: 47.3,
        },
        envelopePoints: [
            { x: 35.0, y: 1500 },
            { x: 35.0, y: 1960 },
            { x: 39.6, y: 2550 },
            { x: 47.3, y: 2550 },
            { x: 47.3, y: 1500 },
            { x: 35.0, y: 1500 }
        ],
    },
    '4x-cau': {
        id: '4x-cau',
        tailNumber: '4X-CAU',
        basicEmptyWeight: 1541.0,
        basicEmptyMoment: 1541.0 * 38.6,
        emptyWeightArm: 38.6,
        fuelCapacity: 50.0,
        usableFuelPerGal: 6.0,
        datumLocation: 'Lower portion of front face of firewall',
        maxBaggage1Weight: 120,
        maxBaggage2Weight: 50,
        maxTotalBaggageWeight: 120,
        maxFrontSeatWeight: 400,
        maxRearSeatWeight: 400,
        maxTakeoffWeight: 2400,
        stationArms: {
            pilot_front_pax: 37.0,
            rear_pax: 73.0,
            baggage_1: 95.0,
            baggage_2: 123.0,
            fuel: 48.0,
        },
        cgLimits: {
            fwd_low: { weight: 1950, arm: 35.0 }, // Standard C172 lower bound
            fwd_high: { weight: 2400, arm: 39.2 }, // Interpolated/Standard for 2400lbs
            aft: 47.3,
        },
        envelopePoints: [
            { x: 35.0, y: 1500 },
            { x: 35.0, y: 1950 },
            { x: 39.2, y: 2400 },
            { x: 47.3, y: 2400 },
            { x: 47.3, y: 1500 },
            { x: 35.0, y: 1500 }
        ],
    },
    'default': {
        id: 'default-172s',
        tailNumber: 'N172SP',
        basicEmptyWeight: 1615.0,
        basicEmptyMoment: 68547.75,
        emptyWeightArm: 42.45,
        fuelCapacity: 60.0,
        usableFuelPerGal: 6.0,
        datumLocation: 'Lower portion of front face of firewall',
        maxBaggage1Weight: 120,
        maxBaggage2Weight: 50,
        maxTotalBaggageWeight: 120,
        maxFrontSeatWeight: 400,
        maxRearSeatWeight: 400,
        maxTakeoffWeight: 2550,
        stationArms: {
            pilot_front_pax: 37.0,
            rear_pax: 73.0,
            baggage_1: 95.0,
            baggage_2: 123.0,
            fuel: 48.0,
        },
        cgLimits: {
            fwd_low: { weight: 2050, arm: 35.0 },
            fwd_high: { weight: 2550, arm: 41.0 },
            aft: 47.3,
        },
        envelopePoints: [
            { x: 35.0, y: 1500 },
            { x: 35.0, y: 2050 },
            { x: 41.0, y: 2550 },
            { x: 47.3, y: 2550 },
            { x: 47.3, y: 1500 },
            { x: 35.0, y: 1500 }
        ],
    },
};

export function getAllPresets(): Array<{ id: string; name: string; tailNumber: string; maxTakeoffWeight: number }> {
    return Object.values(PRESET_AIRCRAFT).map((aircraft) => ({
        id: aircraft.id,
        name: `${aircraft.tailNumber} (BEW: ${aircraft.basicEmptyWeight.toFixed(0)} | MTW: ${aircraft.maxTakeoffWeight.toFixed(0)})`,
        tailNumber: aircraft.tailNumber,
        maxTakeoffWeight: aircraft.maxTakeoffWeight,
    }));
}

export function getPresetAircraft(id: string): Aircraft | undefined {
    return Object.values(PRESET_AIRCRAFT).find(a => a.id === id);
}

export const AIRCRAFT_CONFIG_KEY = 'c172_aircraft_config';
export const CUSTOM_LIST_KEY = 'c172_custom_aircraft_list';

/** Returns all user-saved custom aircraft from localStorage. */
export function getCustomAircraftList(): Aircraft[] {
    try {
        const raw = localStorage.getItem(CUSTOM_LIST_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/** Add or update a custom aircraft in the list (matched by id). */
export function saveCustomAircraft(aircraft: Aircraft): void {
    const list = getCustomAircraftList();
    const idx = list.findIndex(a => a.id === aircraft.id);
    if (idx >= 0) {
        list[idx] = aircraft;
    } else {
        list.push(aircraft);
    }
    localStorage.setItem(CUSTOM_LIST_KEY, JSON.stringify(list));
}

/** Remove one custom aircraft by id. */
export function deleteCustomAircraft(id: string): void {
    const list = getCustomAircraftList().filter(a => a.id !== id);
    localStorage.setItem(CUSTOM_LIST_KEY, JSON.stringify(list));
}

/** Remove ALL custom aircraft and clear current config. */
export function deleteAllCustomAircraft(): void {
    localStorage.removeItem(CUSTOM_LIST_KEY);
}

/**
 * @deprecated use getCustomAircraftList() instead.
 * Returns a single custom aircraft (first in list), or undefined.
 */
export function getCustomAircraft(): Aircraft | undefined {
    return getCustomAircraftList()[0];
}
