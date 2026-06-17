import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { seller as sellerApi } from '../services/api';
import SellerHeader from '../components/SellerHeader';
import SellerInfo from '../components/SellerInfo';
import ErrorState from '../components/ErrorState';
import ProductGrid from '../components/ProductGrid';

export default function TokoSetting() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [errorCode, setErrorCode] = useState(null);
    const [products, setProducts] = useState([]);
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchProfile = useCallback(() => {
        if (!user?.id) return;
        setLoading(true);
        setError(null);
        setErrorCode(null);

        sellerApi.getPublicProfile(Number(user.id))
            .then((res) => {
                if (res.success) {
                    setProfile(res.data);
                } else {
                    setErrorCode(res.code || 'ERR-CAT-02');
                    if (res.code === 'ERR-CAT-01') {
                        setError("Profil penjual tidak aktif");
                    } else if (res.code === 'ERR-CAT-03') {
                        setError("Akun penjual sedang dinonaktifkan");
                    } else if (res.code === 'ERR-TIMEOUT-01') {
                        setError("Server timeout");
                    } else {
                        setError(res.message || "Gagal mengambil data penjual");
                    }
                }
            })
            .catch(() => {
                setErrorCode('ERR-CAT-02');
                setError("Gagal mengambil data penjual");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [user?.id]);

    useEffect(() => {
        if (user?.id) {
            fetchProfile();
        }
    }, [user?.id, fetchProfile]);

    useEffect(() => {
        if (!user?.id) return;
        setCatalogLoading(true);
        sellerApi.getPublicCatalog(Number(user.id), { limit: 12, page })
            .then((res) => {
                if (res.success) {
                    setProducts(res.data || []);
                    if (res.meta) setTotalPages(Math.ceil(res.meta.total / res.meta.limit));
                }
            })
            .catch(() => {})
            .finally(() => setCatalogLoading(false));
    }, [user?.id, page]);

    if (loading) {
        return (
            <div className="bg-[#FAF5F0] min-h-screen py-8">
                <div className="max-w-[80%] mx-auto px-4 space-y-6 animate-pulse">
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="h-40 bg-gray-200" />
                        <div className="px-6 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end -mt-10 gap-4">
                            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                                <div className="w-24 h-24 rounded-2xl bg-white p-1 border shadow-md flex shrink-0">
                                    <div className="w-full h-full bg-gray-200 rounded-xl" />
                                </div>
                                <div className="space-y-2 pb-2">
                                    <div className="h-6 bg-gray-200 rounded w-48" />
                                    <div className="h-4 bg-gray-200 rounded w-64" />
                                </div>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                                <div className="h-10 bg-gray-200 rounded-xl w-28 flex-1 md:flex-none" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
                        <div className="h-6 bg-gray-200 rounded w-36" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-xl shrink-0" />
                                    <div className="space-y-2 flex-1">
                                        <div className="h-3 bg-gray-200 rounded w-16" />
                                        <div className="h-4 bg-gray-200 rounded w-32" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 bg-gray-200 rounded w-24" />
                                <div className="h-24 bg-gray-200 rounded-xl w-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-[#FAF5F0] min-h-screen py-16">
                <ErrorState
                    errorCode={errorCode}
                    message={error}
                    onRetry={errorCode === 'ERR-TIMEOUT-01' ? () => window.location.reload() : fetchProfile}
                />
            </div>
        );
    }

    return (
        <div className="bg-[#FAF5F0] min-h-screen py-8">
            <div className="max-w-[80%] mx-auto px-4">
                <SellerHeader sellerProfile={profile} />
                <SellerInfo sellerProfile={profile} />
            </div>
            <div className="max-w-[80%] mx-auto px-4 mt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Produk</h2>
                <ProductGrid
                    products={products}
                    loading={catalogLoading}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
            </div>
        </div>
    );
}
