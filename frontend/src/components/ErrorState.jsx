import React from 'react';
import { AlertTriangle, WifiOff, ShieldAlert, Ban } from 'lucide-react';

export default function ErrorState({ errorCode, message, onRetry }) {
    // Map error codes to default FSD messages if not explicitly passed
    let displayMessage = message;
    let icon = <AlertTriangle size={32} />;
    let buttonText = "Coba Lagi";

    if (errorCode === 'ERR-CAT-01') {
        displayMessage = "Profil penjual tidak aktif";
        icon = <Ban size={32} className="text-red-500" />;
        buttonText = ""; // No retry for inactive profile
    } else if (errorCode === 'ERR-CAT-03') {
        displayMessage = "Akun penjual sedang dinonaktifkan";
        icon = <ShieldAlert size={32} className="text-red-500" />;
        buttonText = ""; // No retry for disabled profile
    } else if (errorCode === 'ERR-TIMEOUT-01') {
        // Support both timeout texts based on context, default to server timeout
        displayMessage = message || "Server timeout";
        icon = <WifiOff size={32} className="text-yellow-600" />;
        buttonText = "Muat Ulang";
    } else if (errorCode === 'ERR-CAT-02') {
        displayMessage = message || "Gagal memuat data produk";
        icon = <AlertTriangle size={32} className="text-red-600" />;
        buttonText = "Coba Lagi";
    }

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-gray-100 text-center max-w-md mx-auto my-8 shadow-sm">
            <div className="w-16 h-16 bg-[#FAF5F0] rounded-full flex items-center justify-center mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
                Terjadi Kesalahan
            </h3>
            <p className="text-sm text-gray-600 mb-6 max-w-xs font-medium">
                {displayMessage}
            </p>
            {buttonText && onRetry && (
                <button
                    onClick={onRetry}
                    className="px-5 py-2.5 bg-primary-green hover:bg-primary-green-500 text-white font-semibold rounded-xl text-sm transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0"
                >
                    {buttonText}
                </button>
            )}
        </div>
    );
}
