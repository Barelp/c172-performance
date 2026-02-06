export type UnitSystem = 'LBS' | 'KG';

export interface Aircraft {
    id: string;
    tailNumber: string;
    basicEmptyWeight: number; // In LBS
    basicEmptyMoment: number; // In IN-LBS
    emptyWeightArm: number; // CG arm of empty aircraft (inches)
    fuelCapacity: number; // In Gallons
    usableFuelPerGal: number; // e.g., 6 LBS/GAL
    datumLocation: string; // e.g. "Firewall"
    maxBaggage1Weight: number; // Max weight for baggage area 1
    maxBaggage2Weight: number; // Max weight for baggage area 2
    maxTotalBaggageWeight: number; // Max combined baggage weight
    maxFrontSeatWeight: number; // Max combined front seats
    maxRearSeatWeight: number; // Max combined rear seats
    maxTakeoffWeight: number; // Max Gross Weight (lbs)
    stationArms: {
        pilot_front_pax: number;
        rear_pax: number;
        baggage_1: number;
        baggage_2: number;
        fuel: number;
    };
    cgLimits: {
        fwd_low?: { weight: number; arm: number }; // e.g. 35.0" at 1950 lbs
        fwd_high: { weight: number; arm: number }; // e.g. 41.0" at 2550 lbs
        aft: number; // Static aft limit
    };
}

export interface StationArm {
    id: string;
    name: string;
    arm: number; // Inches from datum
    description?: string;
    type: 'variable' | 'fuel' | 'fixed'; // Type of load
    maxWeight?: number;
}

export interface EnvelopePoint {
    weight: number;
    fwdLimit: number;
    aftLimit: number;
}

export interface FlightLog {
    id: string; // UUID
    date: string; // ISO Date
    aircraftId: string;

    // Weights (stored in LBS for consistency)
    pilotWeight: number;
    frontPaxWeight: number;
    rearPax1Weight: number;
    rearPax2Weight: number;
    baggage1Weight: number;
    baggage2Weight: number;
    fuelLeftGallons: number;
    fuelRightGallons: number;
    fuelGallons: number; // Total fuel
    fuelBurnGallons: number;

    unitPreference: UnitSystem;
}

export interface CalculationResult {
    totalWeight: number;
    totalMoment: number;
    cg: number;
    isWithinLimits: boolean;
    status: 'OK' | 'OVERWEIGHT' | 'FWD_CG' | 'AFT_CG';
    landingWeight?: number;
    landingMoment?: number;
    landingCG?: number;
    fuelBurnWeight?: number;
    totalFuelGallons?: number;
    limits?: {
        takeoff: { min: number; max: number };
        landing: { min: number; max: number };
    };
    landingStatus?: 'OK' | 'OVERWEIGHT' | 'FWD_CG' | 'AFT_CG';
    isFuelBurnInvalid?: boolean;
    stationWarnings?: {
        baggage1?: boolean;
        baggage2?: boolean;
        totalBaggage?: boolean;
        frontSeats?: boolean;
        rearSeats?: boolean;
        fuelCapacity?: boolean;
    };
}
