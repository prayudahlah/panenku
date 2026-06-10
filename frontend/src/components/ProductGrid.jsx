import ProductCard from './ProductCard';

export default function ProductGrid({ products, loading, emptyMessage = 'Tidak ada produk ditemukan' }) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border animate-pulse">
                        <div className="bg-gray-200 h-40 rounded-t-xl" />
                        <div className="p-4 space-y-3">
                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                            <div className="h-5 bg-gray-200 rounded w-1/3" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return <p className="text-gray-400 text-center py-12">{emptyMessage}</p>;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}
