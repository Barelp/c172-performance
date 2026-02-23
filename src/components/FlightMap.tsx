import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, ImageOverlay, Polyline, Marker, Tooltip, useMap } from 'react-leaflet';
import { Eye, EyeOff } from 'lucide-react';
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

interface FlightMapProps {
    legs: FlightLeg[];
    origin?: string;
    finalDest?: string;
}

// Bounding box of the provided map image
// TL: [Lon: 34.080108, Lat: 33.435393]
// BR: [Lon: 35.941661, Lat: 31.187427]
// Leaflet uses [Lat, Lon]
const mapBounds: L.LatLngBoundsExpression = [
    [31.187427, 34.080108], // SouthWest / BR (Lat, Lon)
    [33.435393, 35.941661]  // NorthEast / TL (Lat, Lon)
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
            map.flyToBounds(mapBounds as L.LatLngBoundsExpression, { duration: 1 });
        }
    }, [map, routeCoords]);
    return null;
}

export default function FlightMap({ legs, origin, finalDest }: FlightMapProps) {
    const { t } = useTranslation();
    const [imageError, setImageError] = useState(false);
    const [showRoute, setShowRoute] = useState(true);

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
            <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('navPlanner.map.title')}</h3>
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
            <div className="relative w-full h-[600px] z-0 bg-gray-100 dark:bg-gray-900">
                {imageError && (
                    <div className="absolute inset-0 bg-red-50/90 dark:bg-red-900/90 z-[1000] flex flex-col items-center justify-center p-6 text-center">
                        <p className="text-red-600 dark:text-red-400 font-bold text-xl mb-3">{t('navPlanner.map.imageNotFound')}</p>
                        <p className="text-sm text-red-700 dark:text-red-300 max-w-md">
                            {t('navPlanner.map.imageErrorDesc')}
                        </p>
                    </div>
                )}

                <MapContainer
                    bounds={mapBounds}
                    scrollWheelZoom={true}
                    className="w-full h-full"
                    style={{ zIndex: 1 }}
                >
                    {/* The fallback image bounds is standard Israel bounding roughly if needed, 
                        but we stick to what the user provided */}
                    <ImageOverlay
                        url="/flight-map.jpg"
                        bounds={mapBounds}
                        errorOverlayUrl=""
                        eventHandlers={{
                            error: () => setImageError(true),
                            load: () => setImageError(false)
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

                    <MapController routeCoords={routeCoords} />
                </MapContainer>
            </div>
        </div>
    );
}
