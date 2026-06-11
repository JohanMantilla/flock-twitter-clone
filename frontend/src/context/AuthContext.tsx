'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';
import { User, AuthResponse } from '@/types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, username: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('auth_token');
        if (!storedToken) {
            setLoading(false);
            return;
        }

        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        setToken(storedToken);

        api.get<User>('/api/auth/me')
            .then(res => setUser(res.data))
            .catch(() => {
                localStorage.removeItem('auth_token');
                document.cookie = 'auth_token=; Max-Age=0; path=/';
                delete api.defaults.headers.common['Authorization'];
            })
            .finally(() => setLoading(false));
    }, []);

    const saveSession = (data: AuthResponse) => {
        localStorage.setItem('auth_token', data.token);
        document.cookie = `auth_token=${data.token}; path=/; SameSite=Lax`;
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        setToken(data.token);
        setUser(data.user);
    };

    const login = async (email: string, password: string) => {
        const res = await api.post<AuthResponse>('/api/auth/login', { email, password });
        saveSession(res.data);
    };

    const register = async (email: string, password: string, username: string) => {
        const res = await api.post<AuthResponse>('/api/auth/register', {
            email,
            password,
            username,
        });
        saveSession(res.data);
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        document.cookie = 'auth_token=; Max-Age=0; path=/';
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
        setToken(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}