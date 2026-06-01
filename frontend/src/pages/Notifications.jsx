import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../contexts/AuthContext';

export default function Notifications() {
    const { user } = useAuth();
    const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    if (!user) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8">
                <p className="text-gray-500 text-center">Silakan login untuk melihat notifikasi.</p>
            </div>
        );
    }

    const handleClick = async (notif) => {
        if (!notif.isRead) await markAsRead(notif.id);

        if (notif.referenceType === 'negotiation' && notif.referenceId) {
            navigate(`/negotiations/${notif.referenceId}`);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Bell size={24} className="text-gray-700" />
                    <h1 className="text-2xl font-bold">Notifikasi</h1>
                </div>
                {notifications.some((n) => !n.isRead) && (
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-1 text-sm text-primary-green hover:underline"
                    >
                        <CheckCheck size={16} />
                        Tandai semua telah dibaca
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <p className="text-gray-500 text-center py-12">Belum ada notifikasi.</p>
            ) : (
                <div className="space-y-2">
                    {notifications.map((notif) => (
                        <button
                            key={notif.id}
                            onClick={() => handleClick(notif)}
                            className={`w-full text-left p-4 rounded-lg border transition-colors ${
                                notif.isRead
                                    ? 'bg-white border-gray-200'
                                    : 'bg-blue-50 border-blue-200'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${notif.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                                        {notif.title}
                                    </p>
                                    {notif.message && (
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                            {notif.message}
                                        </p>
                                    )}
                                </div>
                                {!notif.isRead && (
                                    <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
