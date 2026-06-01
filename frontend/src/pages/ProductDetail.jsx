import { useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { formatNumber } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import { negotiations } from '../services/api';
import { Handshake } from 'lucide-react';

export default function ProductDetail() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const product = location.state?.product;

    const [priceOffer, setPriceOffer] = useState('');
    const [quantity, setQuantity] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    if (!product) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 text-center">
                <p className="text-gray-500 mb-4">Produk tidak ditemukan.</p>
                <Link to="/catalog" className="text-primary-green underline">Kembali ke katalog</Link>
            </div>
        );
    }

    const price = formatNumber(product.pricePerUnit);
    const minQty = Number(product.minOrderQty);

    const suggestedPrice = Math.floor(Number(product.pricePerUnit) * 0.8);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setResult(null);

        const qty = Number(quantity);
        const priceVal = Number(priceOffer);

        if (qty < minQty) {
            setResult({ type: 'error', message: `Kuantitas minimal ${minQty} ${product.unitName}` });
            return;
        }
        if (priceVal <= 0) {
            setResult({ type: 'error', message: 'Harga tawar harus lebih dari 0' });
            return;
        }

        setSubmitting(true);
        try {
            const json = await negotiations.initiate({
                productId: product.id,
                priceOffer: priceVal,
                unitId: product.unitId,
                quantityOffer: qty,
                description: description || undefined,
            });
            if (json.success) {
                setResult({ type: 'success', message: `Negosiasi berhasil diajukan! (ID: ${json.data.id})` });
            } else {
                setResult({ type: 'error', message: json.message || 'Gagal mengajukan negosiasi' });
            }
        } catch {
            setResult({ type: 'error', message: 'Terjadi kesalahan jaringan' });
        }
        setSubmitting(false);
    };

    const isBuyer = user?.role === 'buyer';
    const canNego = isBuyer && product.isNegotiable;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <Link to="/catalog" className="text-sm text-gray-500 hover:text-primary-green mb-4 inline-block">&larr; Kembali ke katalog</Link>

            <div className="bg-white rounded-xl border p-6 mb-6">
                <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{product.categoryName}</span>

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-500">Harga</span>
                        <p className="font-bold text-lg text-primary-green">Rp {price}<span className="text-xs text-gray-400 font-normal"> /{product.unitName}</span></p>
                    </div>
                    <div>
                        <span className="text-gray-500">Min. Pembelian</span>
                        <p className="font-semibold">{formatNumber(product.minOrderQty)} {product.unitName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Stok</p>
                        <p className="font-semibold">{formatNumber(product.stockQuantity)} {product.unitName}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Toko</span>
                        <p className="font-semibold">{product.farmName}</p>
                    </div>
                </div>

                {product.description && (
                    <div className="mt-4">
                        <span className="text-gray-500 text-sm">Deskripsi</span>
                        <p className="text-sm mt-1">{product.description}</p>
                    </div>
                )}

                {product.isNegotiable && (
                    <span className="inline-block mt-3 text-xs bg-secondary-brown-100 text-secondary-brown-800 px-2 py-0.5 rounded-full font-medium">Bisa nego</span>
                )}
            </div>

            {isBuyer && (
                <Link
                    to={`/contracts/new?sellerId=${product.sellerId}&sellerName=${encodeURIComponent(product.farmName)}`}
                    className="bg-white rounded-xl border p-6 flex items-center justify-between hover:shadow-md transition mb-6"
                >
                    <div>
                        <h2 className="text-lg font-bold">Ajukan Kemitraan</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Kerjasama rutin dengan {product.farmName}</p>
                    </div>
                    <Handshake size={24} className="text-primary-green shrink-0" />
                </Link>
            )}

            {canNego && (
                <div className="bg-white rounded-xl border p-6">
                    <h2 className="text-lg font-bold mb-4">Ajukan Negosiasi</h2>

                    {result && (
                        <div className={`p-3 rounded-lg text-sm mb-4 ${result.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                            {result.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Harga Tawar (Rp)</label>
                            <input type="number" value={priceOffer} onChange={(e) => setPriceOffer(e.target.value)} placeholder={String(suggestedPrice)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green" required />
                            <p className="text-xs text-gray-400 mt-1">Saran: Rp {formatNumber(suggestedPrice)}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Kuantitas ({product.unitName})</label>
                            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder={String(minQty)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green" required />
                            <p className="text-xs text-gray-400 mt-1">Minimal {minQty} {product.unitName}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Catatan (opsional)</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green" />
                        </div>
                        <button type="submit" disabled={submitting} className="w-full py-2 bg-primary-green text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50">
                            {submitting ? 'Mengirim...' : 'Ajukan Negosiasi'}
                        </button>
                    </form>
                </div>
            )}

            {!canNego && user && !product.isNegotiable && (
                <div className="bg-gray-50 rounded-xl border p-6 text-center text-sm text-gray-500">
                    Produk ini tidak dapat dinegosiasikan.
                </div>
            )}

            {!user && (
                <div className="bg-gray-50 rounded-xl border p-6 text-center text-sm text-gray-500">
                    <Link to="/login" className="text-primary-green font-medium underline">Login</Link> untuk melakukan negosiasi.
                </div>
            )}
        </div>
    );
}
