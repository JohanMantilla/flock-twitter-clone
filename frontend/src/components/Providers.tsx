'use client';

import { AuthProvider } from '@/context/AuthContext';
import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({
    children,
}: {
    children: React.ReactNode;
}) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        retry: 1,
                        staleTime: 1000 * 60,
                    },
                },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                {children}
            </AuthProvider>
        </QueryClientProvider>
    );
}