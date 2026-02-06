import type { Aircraft, EnvelopePoint, StationArm } from "../types";

export const DEFAULT_AIRCRAFT: Aircraft = {
    id: 'default-172s',
    tailNumber: '4X-CGI',
    basicEmptyWeight: 1553.0,
    basicEmptyMoment: 64703.51, // 1553 * 41.67
    emptyWeightArm: 41.67,
    fuelCapacity: 40.0,
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
        fwd_low: { weight: 1950, arm: 35.0 },
        fwd_high: { weight: 2400, arm: 39.2 },
        aft: 47.3,
    },
};

// C172S Loading Arrangements
export const STATION_ARMS: StationArm[] = [
    { id: 'pilot_front_pax', name: 'Pilot & Front Passenger', arm: 37.0, type: 'variable' },
    { id: 'rear_pax', name: 'Rear Passengers', arm: 73.0, type: 'variable' },
    { id: 'baggage_1', name: 'Baggage Area 1', arm: 95.0, type: 'variable', maxWeight: 120 },
    { id: 'baggage_2', name: 'Baggage Area 2', arm: 123.0, type: 'variable', maxWeight: 50 },
    { id: 'fuel', name: 'Fuel', arm: 48.0, type: 'fuel' },
];

// C172S Center of Gravity Moment Envelope
// Derived from POH Section 2 Limitations
export const CG_ENVELOPE: EnvelopePoint[] = [
    { weight: 1500, fwdLimit: 35.0, aftLimit: 47.3 }, // Extrapolated lower bound for plotting
    { weight: 1600, fwdLimit: 35.0, aftLimit: 47.3 },
    { weight: 1700, fwdLimit: 35.0, aftLimit: 47.3 },
    { weight: 1800, fwdLimit: 35.0, aftLimit: 47.3 },
    { weight: 1900, fwdLimit: 35.0, aftLimit: 47.3 }, // Fwd limit starts increasing after 1950 in some models, checking 172S specifics
    // Simplified 172S Envelope Points (Normal Category)
    // Max Gross: 2550 lbs
    // Fwd Limit at 2550: 41.0
    // Fwd Limit at 2050 or less: 35.0
    // Aft Limit all weights: 47.3
];

// More granular envelope for plotting
export const PLOT_ENVELOPE = [
    { weight: 1500, cd_fwd: 35.0, cg_aft: 47.3 },
    { weight: 2050, cd_fwd: 35.0, cg_aft: 47.3 },
    { weight: 2400, cd_fwd: 39.2, cg_aft: 47.3 }, // Adjusted for 172P 2400 lbs limit
];

export const MAX_GROSS_WEIGHT = 2400; // LBS (C172P)
