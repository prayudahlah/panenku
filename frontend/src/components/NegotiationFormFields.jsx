import { formatNumber } from '../utils/format';
import { Minus, Plus } from 'lucide-react';

export default function NegotiationFormFields({ product, price, onPriceChange, qty, onQtyChange, desc, onDescChange, suggestedPrice }) {
    return (
        <>
            <div className="flex items-center gap-3 text-xs text-gray-500 pt-1">
                <span>Stok: <strong>{formatNumber(product.stockQuantity)} {product.unitName}</strong></span>
                <span className="text-gray-300">|</span>
                <span>Min: <strong>{formatNumber(product.minOrderQty)} {product.unitName}</strong></span>
            </div>
            <div>
                <label className="text-xs font-medium text-gray-500">Harga Tawar per {product.unitName} (Rp)</label>
                <input type="number" value={price} onChange={(e) => onPriceChange(e.target.value)} placeholder={String(suggestedPrice)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1" required />
                <p className="text-xs text-gray-400 mt-1">Saran: Rp {formatNumber(suggestedPrice)}</p>
            </div>
            <div>
                <label className="text-xs font-medium text-gray-500">Kuantitas ({product.unitName})</label>
                <div className="flex items-center gap-3 mt-1">
                    <button type="button" onClick={() => onQtyChange(Math.max(Number(product.minOrderQty), parseFloat((qty - 0.1).toFixed(2))))} disabled={qty <= Number(product.minOrderQty)} className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><Minus size={16} /></button>
                    <input type="number" step="any" value={qty} onChange={(e) => onQtyChange(Math.max(Number(product.minOrderQty), Number(e.target.value) || 0))} className="w-20 text-center border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" min={Number(product.minOrderQty)} />
                    <button type="button" onClick={() => onQtyChange(Math.min(Number(product.stockQuantity), parseFloat((qty + 0.1).toFixed(2))))} disabled={qty >= Number(product.stockQuantity)} className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><Plus size={16} /></button>
                </div>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">Subtotal</span>
                <span className="text-sm font-bold text-gray-900">Rp {formatNumber((Number(price) || 0) * Number(qty))}</span>
            </div>
            <div>
                <label className="text-xs font-medium text-gray-500">Catatan (opsional)</label>
                <textarea value={desc} onChange={(e) => onDescChange(e.target.value)} rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1" />
            </div>
        </>
    );
}
