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
    windSpeed: string;
    windDir: string;
    temperature: number | '';
}

export interface FlightDetails {
    takeoffTime: string; // HH:mm format
    flightDate: string; // YYYY-MM-DD format
    cruiseGS: number | '';
    cruiseGPH: number | '';
    taxiFuel: number | '';
    tocFuel: number | '';
    origin: string;
    landing1: string;
    landing2: string;
    finalDest: string;
    altName: string;
    altFreq: string;
    pilotName: string;
    pilotLicense: string;
    pilotPhone: string;
    pilotEmail: string;
    paxCount: string;
    flightEndurance: string;
    aircraftType: string;
    callsign: string;
    flightRules: 'V' | 'I';
}

export interface Notam {
    id: number;
    notam: {
        raw: string;
        series: string;
        number: number;
        year: number;
        latitude: number;
        longitude: number;
        radius: number;
        notamText: string;
    };
}
