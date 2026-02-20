export interface FlightLeg {
    id: string;
    to: string;
    from: string;
    distNM: number | '';
    heading: string;
    altitude: string;
    trend: string;
    control: string;
    primaryFreq: string;
    secondaryFreq: string;
    vorName: string;
    vorRadial: string;
    vorDist: string;
}

export interface FlightDetails {
    takeoffTime: string; // HH:mm format
    cruiseGS: number | '';
    cruiseGPH: number | '';
    taxiFuel: number | '';
    origin: string;
    landing1: string;
    landing2: string;
    finalDest: string;
    altName: string;
    altFreq: string;
    registration: string;
    paxCount: string;
    departureDest: string;
    flightEndurance: string;
    aircraftType: string;
    callsign: string;
}
