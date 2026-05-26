import productPlaceholder from '../assets/product_placeholder.webp';

export default function ProductCard({ product }) {
    const price = Number(product.pricePerUnit).toLocaleString('id-ID');

    return (
        <div className="bg-white rounded-xl border hover:shadow-lg transition-shadow">
            <div className="h-40 rounded-t-xl overflow-hidden">
                <img src={productPlaceholder} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-4 space-y-2">
                <h3 className="font-semibold text-sm leading-tight">{product.name}</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {product.categoryName}
                </span>
                <p className="text-primary-green font-bold text-lg">
                    Rp {price}
                    <span className="text-xs text-gray-400 font-normal"> /{product.unitName}</span>
                </p>
                <div className="text-xs text-gray-500 space-y-0.5">
                    <p>Min {Number(product.minOrderQty).toLocaleString('id-ID')} {product.unitName}</p>
                    <p>Toko: {product.farmName}</p>
                </div>
                {product.isNegotiable && (
                    <span className="inline-block text-xs bg-secondary-brown-100 text-secondary-brown-800 px-2 py-0.5 rounded-full font-medium">
                        Bisa nego
                    </span>
                )}
            </div>
        </div>
    );
}
