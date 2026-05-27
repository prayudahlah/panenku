import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

function LocationMarker({ onLocation }) {
    const [position, setPosition] = useState(null);

    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            setPosition([lat, lng]);
            onLocation(lat, lng);
        },
    });

    if (!position) return null;

    return (
        <Marker
            position={position}
            draggable={true}
            eventHandlers={{
                dragend(e) {
                    const { lat, lng } = e.target.getLatLng();
                    setPosition([lat, lng]);
                    onLocation(lat, lng);
                },
            }}
        />
    );
}

export default function MapPicker({ onLocationSelect, height = '300px' }) {
    const [loading, setLoading] = useState(false);

    const handleLocation = (lat, lng) => {
        setLoading(true);

        fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&accept-language=id`,
            { headers: { 'User-Agent': 'Panenku/1.0' } }
        )
            .then((res) => res.json())
            .then((data) => {
                const addr = data.address || {};
                const road = addr.road || '';
                const house = addr.house_number || '';
                const street = [road, house].filter(Boolean).join(' No. ');
                const province = addr.state || '';
                const city = addr.city || addr.town || addr.county || addr.village || addr.region || '';
                const fullAddress = street
                    ? `${street}, ${city}, ${province}`
                    : data.display_name || '';

                onLocationSelect({
                    address: fullAddress,
                    provinceName: province,
                    cityName: city,
                    lat,
                    lng,
                });
            })
            .catch(() => {
                onLocationSelect({
                    address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
                    provinceName: '',
                    cityName: '',
                    lat,
                    lng,
                });
            })
            .finally(() => setLoading(false));
    };

    return (
        <div className="relative">
            <MapContainer
                center={[-2.5, 118]}
                zoom={5}
                className="rounded-lg border"
                style={{ height, width: '100%', zIndex: 1 }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker onLocation={handleLocation} />
            </MapContainer>
            {loading && (
                <span className="absolute bottom-2 left-2 bg-white px-2 py-1 rounded text-xs shadow z-[1000]">
                    Memuat alamat...
                </span>
            )}
            <p className="text-xs text-gray-400 mt-1">Klik peta untuk menandai lokasi, seret pin untuk menyesuaikan</p>
        </div>
    );
}
