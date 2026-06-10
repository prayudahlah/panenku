import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <div className="max-w-4xl mx-auto py-20 px-4 text-center">
            <h1 className="text-7xl font-black text-primary-green mb-4">404</h1>
            <p className="text-gray-500 mb-2">Halaman tidak ditemukan</p>
            <p className="text-gray-400 text-sm mb-8">Halaman yang Anda cari mungkin telah dipindahkan atau dihapus.</p>
            <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-green text-white rounded-xl font-bold hover:opacity-90 transition shadow-sm"
            >
                Kembali ke Beranda
            </Link>
        </div>
    );
}
