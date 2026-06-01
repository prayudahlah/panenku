import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { MapPin, Check, AlertTriangle, Loader } from 'lucide-react';

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

const stripPrefix = (name) => name.replace(/^(Kota|Kabupaten)\s+/i, '');

export default function LocationPicker({ provinces, cities, onConfirm, height = '300px' }) {
    const [location, setLocation] = useState(null);
    const [match, setMatch] = useState(null);
    const [reverseLoading, setReverseLoading] = useState(false);

    const handleMapClick = (lat, lng) => {
        setReverseLoading(true);
        setMatch(null);

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
                const provinceName = addr.state || '';
                const cityName = addr.city || addr.town || addr.county || addr.village || addr.region || '';
                const fullAddress = street
                    ? `${street}, ${cityName}, ${provinceName}`
                    : data.display_name || '';

                const provMatch = provinces.find(
                    (p) =>
                        provinceName.toLowerCase().includes(p.name.toLowerCase()) ||
                        p.name.toLowerCase().includes(provinceName.toLowerCase())
                );

                let cityMatch = null;
                if (provMatch && cityName) {
                    const citiesInProv = cities.filter((c) => c.provinceId === provMatch.id);
                    cityMatch = citiesInProv.find(
                        (c) => stripPrefix(c.name).toLowerCase() === stripPrefix(cityName).toLowerCase()
                    );
                }

                setLocation({ lat, lng, address: fullAddress, provinceName, cityName });
                setMatch({
                    provinceId: provMatch?.id || null,
                    cityId: cityMatch?.id || null,
                    provinceOk: !!provMatch,
                    cityOk: !!cityMatch,
                });
            })
            .catch(() => {
                setLocation({
                    lat,
                    lng,
                    address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
                    provinceName: '',
                    cityName: '',
                });
                setMatch({ provinceId: null, cityId: null, provinceOk: false, cityOk: false });
            })
            .finally(() => setReverseLoading(false));
    };

    const handleConfirm = () => {
        if (!location || !match || reverseLoading) return;
        onConfirm({
            provinceId: match.provinceId,
            cityId: match.cityId,
            address: location.address,
            lat: location.lat,
            lng: location.lng,
            provinceName: location.provinceName,
            cityName: location.cityName,
        });
    };

    return (
        <div className="space-y-3">
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
                    <LocationMarker onLocation={handleMapClick} />
                </MapContainer>
                {reverseLoading && (
                    <span className="absolute bottom-2 left-2 bg-white px-2 py-1 rounded text-xs shadow z-[1000] flex items-center gap-1">
                        <Loader size={12} className="animate-spin" /> Memuat alamat...
                    </span>
                )}
            </div>
            <p className="text-xs text-gray-400">Klik peta untuk menandai lokasi, seret pin untuk menyesuaikan</p>

            {location && match && (
                <div className="border border-gray-200 rounded-lg p-3 space-y-2 bg-white">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                        <MapPin size={16} className="text-primary-green" /> Lokasi terdeteksi:
                    </div>
                    <div className="text-xs space-y-1 text-gray-600">
                        <div className="flex items-center gap-1.5">
                            <span className="w-16 text-gray-400">Provinsi:</span>
                            {match.provinceOk ? (
                                <span className="flex items-center gap-1 text-green-700">
                                    {location.provinceName} <Check size={12} />
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-amber-600">
                                    <AlertTriangle size={12} /> Tidak terdeteksi
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-16 text-gray-400">Kota:</span>
                            {match.cityOk ? (
                                <span className="flex items-center gap-1 text-green-700">
                                    {location.cityName} <Check size={12} />
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-amber-600">
                                    <AlertTriangle size={12} /> Tidak terdeteksi
                                </span>
                            )}
                        </div>
                        <div className="flex items-start gap-1.5">
                            <span className="w-16 text-gray-400 shrink-0">Alamat:</span>
                            <span className="text-gray-700">{location.address}</span>
                        </div>
                    </div>
                    {(!match.provinceOk || !match.cityOk) && (
                        <p className="text-xs text-amber-600">
                            Provinsi/kota tidak dikenali. Pilih secara manual di form setelah konfirmasi.
                        </p>
                    )}
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={reverseLoading}
                        className="w-full mt-1 px-3 py-2 text-sm bg-primary-green text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                        {reverseLoading && <Loader size={14} className="animate-spin" />}
                        Gunakan Lokasi Ini
                    </button>
                </div>
            )}
        </div>
    );
}
