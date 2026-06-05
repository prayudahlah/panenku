import { formatNumber, formatDecimal } from '../utils/format';

export default function NegotiationTimeline({ chats, isOngoing, currentUserId, buyerId, sellerId, buyerName, sellerName }) {
    const label = (turnOwner) => {
        if (turnOwner === 'buyer') {
            return currentUserId === buyerId ? 'Kamu' : (buyerName || 'Pembeli');
        }
        return currentUserId === sellerId ? 'Kamu' : (sellerName || 'Penjual');
    };

    return (
        <div className="space-y-4">
            {chats.length === 0 ? (
                <p className="text-sm text-gray-400">Belum ada riwayat negosiasi untuk produk ini.</p>
            ) : (
                <div className="space-y-4">
                    {chats.map((chat) => (
                        <div key={chat.id || chat.turnOrder} className="relative pl-6 pb-4 border-l-2 border-gray-200 last:border-transparent">
                            <div className={`absolute left-[-5px] w-2.5 h-2.5 rounded-full mt-1 ${chat.turnOwner === 'buyer' ? 'bg-primary-green' : 'bg-secondary-brown'}`} />
                            <p className="text-xs font-medium text-gray-500">{label(chat.turnOwner)}</p>
                            <p className="text-sm font-semibold text-gray-800">Rp {formatNumber(chat.offerPrice)}</p>
                            <p className="text-xs text-gray-500">{formatDecimal(chat.quantityOffer)} {chat.unitName}</p>
                            <p className="text-xs font-semibold text-gray-700 mt-0.5">Rp {formatNumber(chat.offerPrice * chat.quantityOffer)}</p>
                            {chat.description && <p className="text-xs text-gray-400 mt-0.5 italic">{chat.description}</p>}
                            <p className="text-xs text-gray-300 mt-0.5">{new Date(chat.createdAt).toLocaleString('id-ID')}</p>
                        </div>
                    ))}
                    {isOngoing && (
                        <div className="relative pl-6 pb-4">
                            <div className="absolute left-[-5px] w-2.5 h-2.5 rounded-full bg-gray-300 animate-pulse" />
                            <p className="text-xs font-medium text-gray-400">Menunggu respon...</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
