import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, ImageOverlay, Polyline, Marker, Tooltip, useMap } from 'react-leaflet';
import { Eye, EyeOff, Navigation } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { FlightLeg } from '../types/navigation';
import { waypoints } from '../data/waypoints';

// Fix for default marker icons in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconRetinaUrl: iconRetina,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
});

L.Marker.prototype.options.icon = DefaultIcon;

const planeMarkerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 5.5L7.5 15 3.8 14l-1.3 1.3 3.8 2.5 2.5 3.8 1.3-1.3-1-3.7L10.5 15l5.5 6 1.2-.7c.4-.2.7-.6.6-1.1z"/></svg>`;

const getPlaneIcon = (currentHeading: number | null) => {
    // SVG airplane nose points to 45 degrees (top right).
    // To make it face North (0 degrees), we subtract 45.
    const rotation = currentHeading !== null ? currentHeading - 45 : -45;
    return L.divIcon({
        html: `<div style="transform: rotate(${rotation}deg); transform-origin: center center; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: transform 0.2s ease-out;">${planeMarkerSvg}</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        tooltipAnchor: [16, -16],
    });
};

interface FlightMapProps {
    legs: FlightLeg[];
    origin?: string;
    finalDest?: string;
}

// Bounding box of the provided map image (North)
const northMapBounds: L.LatLngBoundsExpression = [
    [31.187427, 34.080108], // SouthWest / BR (Lat, Lon)
    [33.435393, 35.941661]  // NorthEast / TL (Lat, Lon)
];

// Bounding box of the provided map image (South)
// TL: [34.035409, 31.604457]
// BR: [35.874925, 29.342049]
const southMapBounds: L.LatLngBoundsExpression = [
    [29.342049, 34.035409], // SouthWest / BR (Lat, Lon)
    [31.604457, 35.874925]  // NorthEast / TL (Lat, Lon)
];

// Combined bounds to initially fit both
const fullMapBounds: L.LatLngBoundsExpression = [
    [29.342049, 34.035409], // Min Lat, Min Lon (SW)
    [33.435393, 35.941661]  // Max Lat, Max Lon (NE)
];

function MapController({ routeCoords }: { routeCoords: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (routeCoords.length > 0) {
            const bounds = L.latLngBounds(routeCoords);
            if (bounds.isValid()) {
                map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 11, duration: 1 });
            }
        } else {
            map.flyToBounds(fullMapBounds as L.LatLngBoundsExpression, { duration: 1 });
        }
    }, [map, routeCoords]);
    return null;
}

export default function FlightMap({ legs, origin, finalDest }: FlightMapProps) {
    const { t } = useTranslation();
    const [imageErrorNorth, setImageErrorNorth] = useState(false);
    const [imageErrorSouth, setImageErrorSouth] = useState(false);
    const [showRoute, setShowRoute] = useState(true);
    const [isTracking, setIsTracking] = useState(false);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [heading, setHeading] = useState<number | null>(null);

    const toggleTracking = () => {
        if (!isTracking) {
            // Request permission on iOS 13+ devices for DeviceOrientation
            if (typeof (DeviceOrientationEvent as any) !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                (DeviceOrientationEvent as any).requestPermission()
                    .then(() => {
                        setIsTracking(true);
                    })
                    .catch((err: Error) => {
                        console.error('DeviceOrientation permission error:', err);
                        setIsTracking(true); // fall back
                    });
            } else {
                setIsTracking(true);
            }
        } else {
            setIsTracking(false);
        }
    };

    useEffect(() => {
        let watchId: number;

        const handleOrientation = (event: DeviceOrientationEvent) => {
            let newHeading = null;
            if ((event as any).webkitCompassHeading) {
                newHeading = (event as any).webkitCompassHeading;
            } else if (event.absolute && event.alpha !== null) {
                newHeading = 360 - event.alpha;
            }
            if (newHeading !== null) {
                setHeading(newHeading);
            }
        };

        if (isTracking) {
            if ('geolocation' in navigator) {
                watchId = navigator.geolocation.watchPosition(
                    (position) => {
                        setUserLocation([position.coords.latitude, position.coords.longitude]);
                    },
                    (error) => {
                        console.error("Error getting location:", error);
                        // If there's a permission error, we might want to stop tracking automatically
                        if (error.code === error.PERMISSION_DENIED) {
                            setIsTracking(false);
                        }
                    },
                    { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
                );
            } else {
                console.error("Geolocation is not supported by this browser.");
                setIsTracking(false);
            }

            if (window.DeviceOrientationEvent) {
                window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener);
                window.addEventListener('deviceorientation', handleOrientation as EventListener);
            }
        } else {
            setUserLocation(null);
            setHeading(null);
        }

        return () => {
            if (watchId !== undefined) {
                navigator.geolocation.clearWatch(watchId);
            }
            if (window.DeviceOrientationEvent) {
                window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener);
                window.removeEventListener('deviceorientation', handleOrientation as EventListener);
            }
        };
    }, [isTracking]);

    // Extract all points
    const points: { code: string; lat: number; lon: number }[] = [];

    const getWaypoint = (codeOrName: string) => {
        if (!codeOrName) return null;
        const code = codeOrName.split('-')[0].trim().toUpperCase();
        return waypoints.find(wp => wp.code.toUpperCase() === code);
    };

    if (origin) {
        const wp = getWaypoint(origin);
        if (wp && wp.lat && wp.lon) points.push({ code: wp.code, lat: wp.lat, lon: wp.lon });
    }

    legs.forEach(leg => {
        if (leg.from && points.length === 0) {
            const wp = getWaypoint(leg.from);
            if (wp && wp.lat && wp.lon) points.push({ code: wp.code, lat: wp.lat, lon: wp.lon });
        }
        if (leg.to) {
            const wp = getWaypoint(leg.to);
            if (wp && wp.lat && wp.lon) points.push({ code: wp.code, lat: wp.lat, lon: wp.lon });
        }
    });

    if (finalDest) {
        const wp = getWaypoint(finalDest);
        if (wp && wp.lat && wp.lon) {
            // Only push if it's not already the last point
            if (points.length === 0 || points[points.length - 1].code !== wp.code) {
                points.push({ code: wp.code, lat: wp.lat, lon: wp.lon });
            }
        }
    }

    const routeCoords: [number, number][] = points.map(p => [p.lat, p.lon]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 w-full sm:w-auto text-center sm:text-start">{t('navPlanner.map.title')}</h3>
                <div className="flex flex-wrap justify-center sm:justify-end gap-2 w-full sm:w-auto">
                    <button
                        onClick={toggleTracking}
                        className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${isTracking
                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                            : 'text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                    >
                        <Navigation className={`h-4 w-4 ${isTracking ? 'fill-blue-500 text-blue-500' : ''}`} />
                        {isTracking ? t('navPlanner.map.stopTracking') : t('navPlanner.map.trackLocation')}
                    </button>
                    <button
                        onClick={() => setShowRoute(!showRoute)}
                        className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        {showRoute ? (
                            <><EyeOff className="h-4 w-4" /> {t('navPlanner.map.hideRoute')}</>
                        ) : (
                            <><Eye className="h-4 w-4" /> {t('navPlanner.map.showRoute')}</>
                        )}
                    </button>
                </div>
            </div>
            <div className="relative w-full h-[600px] sm:h-[700px] md:h-[800px] z-0 bg-gray-100 dark:bg-gray-900">
                {(imageErrorNorth || imageErrorSouth) && (
                    <div className="absolute inset-x-0 top-0 bg-red-50/90 dark:bg-red-900/90 z-[1000] flex flex-col items-center justify-center p-2 text-center border-b border-red-200 dark:border-red-800">
                        <p className="text-red-600 dark:text-red-400 font-bold text-sm">
                            {t('navPlanner.map.imageNotFound', 'One or more map images not found')}
                        </p>
                    </div>
                )}

                <MapContainer
                    bounds={fullMapBounds}
                    scrollWheelZoom={true}
                    className="w-full h-full"
                    style={{ zIndex: 1 }}
                >
                    {/* Northern Map */}
                    <ImageOverlay
                        url="/flight-map.jpg"
                        bounds={northMapBounds}
                        zIndex={10}
                        className="north-map-overlay"
                        errorOverlayUrl=""
                        eventHandlers={{
                            error: () => setImageErrorNorth(true),
                            load: () => setImageErrorNorth(false)
                        }}
                    />

                    {/* Southern Map */}
                    <ImageOverlay
                        url="/aip_CVFR_South_2023_page-0001.jpg"
                        bounds={southMapBounds}
                        zIndex={1}
                        className="south-map-overlay"
                        errorOverlayUrl=""
                        eventHandlers={{
                            error: () => setImageErrorSouth(true),
                            load: () => setImageErrorSouth(false)
                        }}
                    />

                    {showRoute && routeCoords.length > 0 && (
                        <Polyline
                            positions={routeCoords}
                            pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.8 }}
                        />
                    )}

                    {showRoute && points.map((p, idx) => (
                        <Marker key={`${p.code}-${idx}`} position={[p.lat, p.lon]}>
                            <Tooltip permanent direction="top" offset={[0, -20]} className="font-bold text-xs bg-white/90">
                                {p.code}
                            </Tooltip>
                        </Marker>
                    ))}

                    {userLocation && (
                        <Marker
                            position={userLocation}
                            icon={getPlaneIcon(heading)}
                            zIndexOffset={1000}
                        >
                            <Tooltip direction="top" offset={[0, -10]} className="font-bold text-xs">
                                {t('navPlanner.map.myLocation', 'My Location')}
                            </Tooltip>
                        </Marker>
                    )}

                    <MapController routeCoords={routeCoords} />
                </MapContainer>
            </div>
        </div>
    );
}
