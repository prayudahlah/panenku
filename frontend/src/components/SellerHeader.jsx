import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Store, MapPin, Star, MessageSquare, Grid, Award } from 'lucide-react';
import { formatDate } from '../utils/format';

export default function SellerHeader({ sellerProfile }) {
    const navigate = useNavigate();
    const location = useLocation();
    const isCatalogPage = location.pathname.endsWith('/catalog');


    const farmName = sellerProfile.farmName || "Toko Tani";
    const city = sellerProfile.city || "Lokasi tidak diketahui";
    const province = sellerProfile.province || "";
    const sellerName = sellerProfile.sellerName || "Penjual";
    const activeProductCount = sellerProfile.activeProductCount ?? 0;
    const joinedDate = sellerProfile.createdAt ? formatDate(sellerProfile.createdAt) : "-";

    const handleChatClick = () => {
        alert(`Fitur chat dengan ${farmName} akan segera hadir!`);
    };

    const handleViewCatalogClick = () => {
        if (isCatalogPage) {
            navigate(`/seller/${sellerProfile.sellerId}`);
        } else {
            navigate(`/seller/${sellerProfile.sellerId}/catalog`);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm mb-6">
            {/* Cover photo placeholder */}
            <div className="h-32 md:h-40 bg-gradient-to-r from-primary-green to-primary-green-500 relative" />

            {/* Seller profile info */}
            <div className="px-6 pb-6 relative flex flex-col md:flex-row justify-between items-start md:items-end -mt-10 gap-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                    {/* Store Logo Avatar */}
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white p-1 shadow-md border border-gray-100 flex items-center justify-center shrink-0">
                        <div className="w-full h-full bg-[#FAF5F0] rounded-xl flex items-center justify-center text-primary-green">
                            <Store size={40} className="stroke-[1.5]" />
                        </div>
                    </div>

                    {/* Shop Details */}
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">{farmName}</h1>
                            <span className="bg-[#CAECBC] text-[#154212] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <Award size={10} />
                                Active Seller
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs md:text-sm text-gray-500 font-medium">
                            <p className="flex items-center gap-1">
                                <MapPin size={14} className="text-gray-400" />
                                {city}{province ? `, ${province}` : ''}
                            </p>
                            <span className="hidden md:inline text-gray-300">|</span>
                            <p className="flex items-center gap-1">
                                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                <span className="font-bold text-gray-800">4.8</span> (Rating Toko)
                            </p>
                            <span className="hidden md:inline text-gray-300">|</span>
                            <p className="font-semibold text-primary-green">
                                {activeProductCount} Produk Aktif
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2.5 w-full md:w-auto mt-2 md:mt-0 shrink-0">
                    <button
                        onClick={handleChatClick}
                        className="flex-1 md:flex-none px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-700 font-bold rounded-xl text-sm transition-all hover:bg-gray-50 flex items-center justify-center gap-2 shadow-sm"
                    >
                        <MessageSquare size={16} className="text-gray-400" />
                        Chat Seller
                    </button>

                    <button
                        onClick={handleViewCatalogClick}
                        className="flex-1 md:flex-none px-4 py-2.5 bg-primary-green hover:bg-primary-green-500 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        {isCatalogPage ? (
                            <>
                                <Store size={16} />
                                Lihat Profil Toko
                            </>
                        ) : (
                            <>
                                <Grid size={16} />
                                Lihat Semua Produk
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
