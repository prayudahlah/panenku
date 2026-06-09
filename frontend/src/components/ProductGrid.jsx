import ProductCard from './ProductCard';
import EmptyState from './EmptyState';

export default function ProductGrid({ products, loading, onReset }) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4 animate-pulse">
                        <div className="bg-gray-200 h-48 rounded-xl w-full" />
                        <div className="space-y-3">
                            <div className="h-5 bg-gray-200 rounded-md w-3/4" />
                            <div className="h-4 bg-gray-200 rounded-md w-1/3" />
                            <div className="h-4 bg-gray-200 rounded-md w-1/2" />
                            <div className="flex justify-between items-end pt-2">
                                <div className="h-6 bg-gray-200 rounded-md w-1/3" />
                                <div className="h-10 bg-gray-200 rounded-full w-10" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!products || products.length === 0) {
        return <EmptyState onReset={onReset} />;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}
