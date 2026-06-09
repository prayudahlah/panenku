import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { seller as sellerApi, references } from '../services/api';
import SellerHeader from '../components/SellerHeader';
import ProductGrid from '../components/ProductGrid';
import ErrorState from '../components/ErrorState';

export default function SellerCatalog() {
    const { sellerId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    // States for Seller Profile Header
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileError, setProfileError] = useState(null);
    const [profileErrorCode, setProfileErrorCode] = useState(null);

    // States for Seller Products Catalog
    const [products, setProducts] = useState([]);
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [catalogError, setCatalogError] = useState(null);
    const [catalogErrorCode, setCatalogErrorCode] = useState(null);

    // Category options from reference API
    const [categories, setCategories] = useState([]);

    // URL State parameters
    const searchVal = searchParams.get('q') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const sort = searchParams.get('sort') || 'createdAt_desc';
    const page = Number(searchParams.get('page')) || 1;

    // Fetch Seller Profile (Header details & validation check)
    const fetchProfile = useCallback(() => {
        setProfileLoading(true);
        setProfileError(null);
        setProfileErrorCode(null);

        sellerApi.getPublicProfile(Number(sellerId))
            .then((res) => {
                if (res.success) {
                    setProfile(res.data);
                } else {
                    setProfileErrorCode(res.code || 'ERR-CAT-02');
                    if (res.code === 'ERR-CAT-01') {
                        setProfileError("Profil penjual tidak aktif");
                    } else if (res.code === 'ERR-CAT-03') {
                        setProfileError("Akun penjual sedang dinonaktifkan");
                    } else if (res.code === 'ERR-TIMEOUT-01') {
                        setProfileError("Server timeout");
                    } else {
                        setProfileError(res.message || "Gagal mengambil data penjual");
                    }
                }
            })
            .catch(() => {
                setProfileErrorCode('ERR-CAT-02');
                setProfileError("Gagal mengambil data penjual");
            })
            .finally(() => {
                setProfileLoading(false);
            });
    }, [sellerId]);

    // Fetch Products Catalog
    const fetchCatalog = useCallback(() => {
        setCatalogLoading(true);
        setCatalogError(null);
        setCatalogErrorCode(null);

        const [sortBy, sortOrder] = sort.split('_');
        const params = {
            search: searchVal || undefined,
            categoryId: categoryId || undefined,
            sortBy,
            sortOrder,
            page: String(page),
            limit: '12',
        };

        sellerApi.getPublicCatalog(Number(sellerId), params)
            .then((res) => {
                if (res.success) {
                    setProducts(res.data || []);
                } else {
                    setCatalogErrorCode(res.code || 'ERR-CAT-02');
                    if (res.code === 'ERR-TIMEOUT-01') {
                        setCatalogError("Server timeout");
                    } else {
                        setCatalogError(res.message || "Gagal memuat data produk");
                    }
                }
            })
            .catch(() => {
                setCatalogErrorCode('ERR-CAT-02');
                setCatalogError("Gagal memuat data produk");
            })
            .finally(() => {
                setCatalogLoading(false);
            });
    }, [sellerId, searchVal, categoryId, sort, page]);

    // Fetch categories for filter dropdown
    useEffect(() => {
        references.getProductCategories().then((res) => {
            if (res.success) {
                setCategories(res.data || []);
            }
        });
    }, []);

    useEffect(() => {
        if (sellerId) {
            fetchProfile();
        }
    }, [sellerId, fetchProfile]);

    useEffect(() => {
        if (sellerId) {
            fetchCatalog();
        }
    }, [sellerId, fetchCatalog]);

    // Update query params helper
    const updateParam = (key, value) => {
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.set('page', '1');
        setSearchParams(params);
    };

    const handleSearchChange = (e) => {
        updateParam('q', e.target.value);
    };

    const handleCategoryChange = (e) => {
        updateParam('categoryId', e.target.value);
    };

    const handleSortChange = (e) => {
        updateParam('sort', e.target.value);
    };

    const handleResetFilters = () => {
        setSearchParams({});
    };

    if (profileLoading) {
        return (
            <div className="bg-[#FAF5F0] min-h-screen py-8">
                <div className="max-w-[80%] mx-auto px-4 space-y-6 animate-pulse">
                    <div className="h-40 bg-gray-200 rounded-2xl w-full" />
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
                        <div className="h-10 bg-gray-200 rounded-xl w-1/3" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="space-y-4">
                                    <div className="bg-gray-200 h-40 rounded-xl" />
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (profileError) {
        return (
            <div className="bg-[#FAF5F0] min-h-screen py-16">
                <ErrorState 
                    errorCode={profileErrorCode} 
                    message={profileError} 
                    onRetry={profileErrorCode === 'ERR-TIMEOUT-01' ? () => window.location.reload() : fetchProfile} 
                />
            </div>
        );
    }

    return (
        <div className="bg-[#FAF5F0] min-h-screen py-8">
            <div className="max-w-[80%] mx-auto px-4">
                {/* Header */}
                <SellerHeader sellerProfile={profile} />

                {/* Filter and Catalog Content */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    {/* Search and Filters Control bar */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6 pb-6 border-b border-gray-100">
                        {/* Search Seller Products */}
                        <div className="w-full md:w-72 relative">
                            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchVal}
                                onChange={handleSearchChange}
                                placeholder="Cari produk di toko ini..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-green bg-gray-50 text-gray-800"
                            />
                        </div>

                        {/* Dropdown Filters and Sort */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            {/* Category Filter */}
                            <select
                                value={categoryId}
                                onChange={handleCategoryChange}
                                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-primary-green cursor-pointer shadow-sm hover:border-gray-300 transition-colors flex-1 sm:flex-none"
                            >
                                <option value="">Semua Kategori</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>

                            {/* Sort Dropdown */}
                            <select
                                value={sort}
                                onChange={handleSortChange}
                                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-primary-green cursor-pointer shadow-sm hover:border-gray-300 transition-colors flex-1 sm:flex-none"
                            >
                                <option value="createdAt_desc">Terbaru</option>
                                <option value="price_asc">Harga Terendah</option>
                                <option value="price_desc">Harga Tertinggi</option>
                            </select>
                        </div>
                    </div>

                    {/* Catalog Grid */}
                    {catalogError ? (
                        <ErrorState 
                            errorCode={catalogErrorCode} 
                            message={catalogError} 
                            onRetry={fetchCatalog} 
                        />
                    ) : (
                        <ProductGrid
                            products={products}
                            loading={catalogLoading}
                            onReset={handleResetFilters}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
