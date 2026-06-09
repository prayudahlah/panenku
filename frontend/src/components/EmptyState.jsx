import React from 'react';
import { SearchX } from 'lucide-react';

export default function EmptyState({ onReset }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-gray-100 text-center max-w-md mx-auto my-8 shadow-sm">
            <div className="w-16 h-16 bg-[#FAF5F0] rounded-full flex items-center justify-center text-primary-green mb-4">
                <SearchX size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
                Tidak ada produk ditemukan
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
                Coba sesuaikan kata kunci pencarian Anda atau atur ulang filter untuk menemukan hasil panen lainnya.
            </p>
            {onReset && (
                <button
                    onClick={onReset}
                    className="px-5 py-2.5 bg-primary-green hover:bg-primary-green-500 text-white font-semibold rounded-xl text-sm transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0"
                >
                    Reset Filter
                </button>
            )}
        </div>
    );
}
