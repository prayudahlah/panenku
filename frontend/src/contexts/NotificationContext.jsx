import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { fetchApi } from '../services/api';
import { API_URL } from '../constants';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const eventSourceRef = useRef(null);
    const pollingRef = useRef(null);

    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;
        try {
            const json = await fetchApi('/notifications/unread');
            if (json.success) setUnreadCount(json.data.count);
        } catch {}
    }, [user]);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const json = await fetchApi('/notifications');
            if (json.success) setNotifications(json.data);
        } catch {}
    }, [user]);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
            return;
        }

        fetchUnreadCount();

        const es = new EventSource(`${API_URL}/notifications/stream`, { withCredentials: true });
        eventSourceRef.current = es;

        es.addEventListener('notification', (event) => {
            try {
                const data = JSON.parse(event.data);
                setNotifications((prev) => [data, ...prev]);
                setUnreadCount((prev) => prev + 1);
            } catch {}
        });

        es.onerror = () => {};

        pollingRef.current = setInterval(fetchUnreadCount, 60000);

        return () => {
            es.close();
            eventSourceRef.current = null;
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, [user, fetchUnreadCount]);

    const markAsRead = useCallback(async (id) => {
        try {
            await fetchApi(`/notifications/${id}/read`, { method: 'PATCH' });
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch {}
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await fetchApi('/notifications/read-all', { method: 'PATCH' });
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch {}
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            fetchNotifications,
            markAsRead,
            markAllAsRead,
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
