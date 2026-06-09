import React from 'react';
import { User, Calendar, ShieldCheck, FileText, BadgeCheck } from 'lucide-react';
import { formatDate } from '../utils/format';

export default function SellerInfo({ sellerProfile }) {
    const joinedDate = sellerProfile.createdAt ? formatDate(sellerProfile.createdAt) : "-";
    const status = "ACTIVE"; // Route only shows if status is active

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
            <div>
                <h2 className="text-gray-900 font-extrabold text-lg flex items-center gap-2">
                    <FileText size={20} className="text-primary-green" />
                    Informasi Toko
                </h2>
                <div className="h-0.5 bg-gray-100 mt-3" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Details list */}
                <div className="space-y-4">
                    <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 bg-[#FAF5F0] rounded-xl flex items-center justify-center text-primary-green shrink-0 mt-0.5">
                            <User size={18} />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Nama Penjual</span>
                            <p className="text-sm font-semibold text-gray-800 mt-0.5">
                                {sellerProfile.sellerName || "-"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 bg-[#FAF5F0] rounded-xl flex items-center justify-center text-primary-green shrink-0 mt-0.5">
                            <Calendar size={18} />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Bergabung Sejak</span>
                            <p className="text-sm font-semibold text-gray-800 mt-0.5">{joinedDate}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 bg-[#FAF5F0] rounded-xl flex items-center justify-center text-primary-green shrink-0 mt-0.5">
                            <ShieldCheck size={18} />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Status Toko</span>
                            <div className="flex items-center gap-1 mt-0.5">
                                <BadgeCheck size={16} className="text-primary-green fill-primary-green/20" />
                                <span className="text-sm font-bold text-primary-green uppercase tracking-wide">
                                    {status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Farm description */}
                <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Deskripsi Toko</span>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 min-h-[120px]">
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line font-medium">
                            {sellerProfile.description || `${sellerProfile.farmName} merupakan penjual terpercaya di platform Panenku yang menyediakan hasil bumi berkualitas terbaik langsung dari kebun kami.`}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
