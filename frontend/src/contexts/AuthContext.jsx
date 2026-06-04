import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        auth.me()
            .then((json) => {
                if (json.success) setUser(json.data);
            })
            .finally(() => setLoading(false));
    }, []);

    const login = async (data) => {
        const json = await auth.login(data);
        if (json.success) setUser(json.data);
        return json;
    };

    const register = async (data) => {
        const json = await auth.register(data);
        if (json.success) setUser(json.data);
        return json;
    };

    const logout = async () => {
        await auth.logout();
        setUser(null);
    };

    const upgradeRole = (userData) => {
        setUser(userData);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, upgradeRole }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
