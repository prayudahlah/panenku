import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { products as productsApi, references } from '../services/api';
import SearchFilters from '../components/SearchFilters';
import ProductGrid from '../components/ProductGrid';
import ErrorState from '../components/ErrorState';

const sortOptions = [
    { value: 'createdAt_desc', label: 'Terbaru' },
    { value: 'price_asc', label: 'Harga Terendah' },
    { value: 'price_desc', label: 'Harga Tertinggi' },
    { value: 'name_asc', label: 'Nama A-Z' },
];

export default function Catalog() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [productsData, setProductsData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [errorCode, setErrorCode] = useState(null);
    const [meta, setMeta] = useState({ total: 0, page: 1, limit: 12 });

    // Read query parameters
    const q = searchParams.get('q') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const isNegotiableParam = searchParams.get('isNegotiable');
    const sort = searchParams.get('sort') || 'createdAt_desc';
    const page = Number(searchParams.get('page')) || 1;

    const isNegotiable = useMemo(() => {
        if (isNegotiableParam === 'true') return true;
        if (isNegotiableParam === 'false') return false;
        return undefined;
    }, [isNegotiableParam]);

    // Fetch categories on mount
    useEffect(() => {
        references.getProductCategories().then((res) => {
            if (res.success) {
                setCategories(res.data || []);
            }
        });
    }, []);

    const fetchProducts = useCallback(() => {
        setLoading(true);
        setError(null);
        setErrorCode(null);

        const [sortBy, sortOrder] = sort.split('_');
        const params = {
            page: String(page),
            limit: '12',
            sortBy,
            sortOrder,
            search: q || undefined,
            categoryId: categoryId || undefined,
            minPrice: minPrice || undefined,
            maxPrice: maxPrice || undefined,
            isNegotiable: isNegotiable !== undefined ? String(isNegotiable) : undefined,
        };

        console.log('Catalog fetchProducts params object:', params);

        productsApi.list(params)
            .then((json) => {
                if (json.success) {
                    setProductsData(json.data || []);
                    setMeta(json.meta || { total: 0, page: 1, limit: 12 });
                } else {
                    setError(json.message || 'Gagal memuat data produk');
                    setErrorCode(json.errorCode || 'ERR-CAT-02');
                }
            })
            .catch((err) => {
                setError('Gagal memuat data produk');
                setErrorCode('ERR-CAT-02');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [q, categoryId, minPrice, maxPrice, isNegotiable, sort, page]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleApplyFilters = (newFilters) => {
        console.log('Catalog handleApplyFilters received newFilters:', newFilters);
        const params = new URLSearchParams(searchParams);
        
        if (newFilters.categoryId) {
            params.set('categoryId', String(newFilters.categoryId));
        } else {
            params.delete('categoryId');
        }

        if (newFilters.minPrice) {
            params.set('minPrice', String(newFilters.minPrice));
        } else {
            params.delete('minPrice');
        }

        if (newFilters.maxPrice) {
            params.set('maxPrice', String(newFilters.maxPrice));
        } else {
            params.delete('maxPrice');
        }

        if (newFilters.isNegotiable !== undefined) {
            params.set('isNegotiable', String(newFilters.isNegotiable));
        } else {
            params.delete('isNegotiable');
        }

        params.set('page', '1');
        console.log('Catalog handleApplyFilters updating searchParams to:', params.toString());
        setSearchParams(params);
    };

    const handleSortChange = (value) => {
        const params = new URLSearchParams(searchParams);
        params.set('sort', value);
        params.set('page', '1');
        setSearchParams(params);
    };

    const handleResetFilters = () => {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        setSearchParams(params);
    };

    const handleGoToPage = (newPage) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', String(newPage));
        setSearchParams(params);
    };

    const totalPages = Math.ceil(meta.total / 12);

    return (
        <div className="bg-[#FAF5F0] min-h-screen py-8">
            <div className="max-w-[80%] mx-auto px-4">
                <div className="flex gap-8 flex-col md:flex-row">
                    {/* Left Sidebar Filter */}
                    <SearchFilters
                        categories={categories}
                        initialFilters={{
                            categoryId,
                            minPrice,
                            maxPrice,
                            isNegotiable,
                        }}
                        onApply={handleApplyFilters}
                    />

                    {/* Main Content Area */}
                    <main className="flex-1">
                        {/* Error Handling */}
                        {error ? (
                            <ErrorState
                                errorCode={errorCode}
                                message={error}
                                onRetry={errorCode === 'ERR-TIMEOUT-01' ? () => window.location.reload() : fetchProducts}
                            />
                        ) : (
                            <>
                                {/* Header */}
                                <div className="flex justify-between items-center mb-6 flex-wrap gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                    <div>
                                        <h1 className="text-[#154212] text-2xl font-extrabold">Hasil Pencarian</h1>
                                        <p className="text-sm text-gray-500 font-medium mt-1">
                                            {loading 
                                                ? "Memuat hasil..." 
                                                : `Menampilkan ${meta.total} hasil ${q ? `untuk '${q}'` : ''}`
                                            }
                                        </p>
                                    </div>

                                    {/* Sort By Dropdown */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sort By:</span>
                                        <select
                                            value={sort}
                                            onChange={(e) => handleSortChange(e.target.value)}
                                            className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-primary-green cursor-pointer shadow-sm hover:border-gray-300 transition-colors"
                                        >
                                            {sortOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Product Grid (supports skeletal loading & empty states) */}
                                <ProductGrid
                                    products={productsData}
                                    loading={loading}
                                    onReset={handleResetFilters}
                                />

                                {/* Pagination (if applicable) */}
                                {!loading && totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-8">
                                        <button
                                            disabled={page <= 1}
                                            onClick={() => handleGoToPage(page - 1)}
                                            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                                        >
                                            Sebelumnya
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                            <button
                                                key={p}
                                                onClick={() => handleGoToPage(p)}
                                                className={`w-10 h-10 border rounded-xl text-sm font-bold transition-all ${
                                                    p === page 
                                                        ? 'bg-primary-green text-white border-primary-green shadow-sm' 
                                                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                        <button
                                            disabled={page >= totalPages}
                                            onClick={() => handleGoToPage(page + 1)}
                                            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                                        >
                                            Selanjutnya
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
