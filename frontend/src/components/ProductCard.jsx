import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { formatNumber } from '../utils/format';
import { cart } from '../services/api';
import productPlaceholder from '../assets/product_placeholder.webp';

export default function ProductCard({ product }) {
    const navigate = useNavigate();
    const price = formatNumber(product.pricePerUnit);

    const [isFavorite, setIsFavorite] = useState(() => {
        const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
        return favs.includes(product.id);
    });

    const toggleFavorite = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
        let nextFavs;
        if (isFavorite) {
            nextFavs = favs.filter(id => id !== product.id);
        } else {
            nextFavs = [...favs, product.id];
        }
        localStorage.setItem('favorites', JSON.stringify(nextFavs));
        setIsFavorite(!isFavorite);
    };

    const handleSellerClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/seller/${product.sellerId}`);
    };

    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const res = await cart.addItem({
                productId: product.id,
                quantity: Number(product.minOrderQty) || 1,
                unitId: product.unitId,
            });
            if (res.success) {
                alert(`Berhasil menambahkan ${product.name} ke keranjang!`);
            } else {
                alert(res.message || 'Gagal menambahkan ke keranjang');
            }
        } catch {
            alert('Terjadi kesalahan jaringan');
        }
    };

    return (
        <Link to={`/product/${product.id}`} state={{ product }} className="block group">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative flex flex-col h-full">
                {/* Product Image */}
                <div className="h-48 w-full overflow-hidden bg-gray-50 relative">
                    <img 
                        src={productPlaceholder} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                </div>

                {/* Content Area */}
                <div className="p-4 flex flex-col flex-1 space-y-3 relative">
                    {/* Name and Heart Icon */}
                    <div className="flex justify-between items-start gap-2">
                        <h3 className="font-semibold text-gray-800 text-sm md:text-base leading-snug line-clamp-2">
                            {product.name}
                        </h3>
                        <button 
                            onClick={toggleFavorite}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                            <Heart 
                                size={20} 
                                className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"} 
                            />
                        </button>
                    </div>

                    {/* Category Name Badge (if exists) */}
                    {product.categoryName && (
                        <div className="flex flex-wrap gap-1">
                            <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                                {product.categoryName}
                            </span>
                        </div>
                    )}

                    {/* Seller details row with orange province/city tag */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {product.provinceName && (
                            <span className="bg-[#FFDBC9] text-[#934B19] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                                {product.provinceName}
                            </span>
                        )}
                        {!product.provinceName && product.cityName && (
                            <span className="bg-[#FFDBC9] text-[#934B19] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                                {product.cityName}
                            </span>
                        )}
                        <span 
                            onClick={handleSellerClick}
                            className="text-xs text-gray-500 font-medium hover:text-primary-green hover:underline cursor-pointer truncate max-w-[120px]"
                            title={product.farmName || 'Kunjungi Toko'}
                        >
                            {product.farmName}
                        </span>
                    </div>

                    {/* Negotiable status badge */}
                    {product.isNegotiable && (
                        <div>
                            <span className="inline-block text-[10px] bg-[#CAECBC] text-[#154212] px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                                NEGO TERSEDIA
                            </span>
                        </div>
                    )}

                    {/* Price and Cart Button at the bottom */}
                    <div className="flex justify-between items-end pt-2 mt-auto">
                        <div>
                            <p className="text-[#154212] font-extrabold text-base md:text-lg">
                                Rp {price}
                                <span className="text-xs text-gray-400 font-normal"> /{product.unitName}</span>
                            </p>
                        </div>

                        {/* Floating Add to Cart Circle Button */}
                        <button
                            onClick={handleAddToCart}
                            className="w-10 h-10 bg-primary-green hover:bg-primary-green-500 text-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                        >
                            <ShoppingCart size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
}
