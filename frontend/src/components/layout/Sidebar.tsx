'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
    { href: '/home', label: 'Home', icon: 'ti-home' },
    { href: '/search', label: 'Search', icon: 'ti-search' },
    { href: '/profile', label: 'Profile', icon: 'ti-user' },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const profileHref = user ? `/profile/${user.username}` : '/profile';

    return (
        <aside className="hidden lg:flex flex-col w-60 shrink-0 px-4 py-6 sticky top-0 h-screen border-r border-gray-100">
            <div className="mb-8 px-2">
                <span className="text-xl font-medium text-gray-900">Twitter</span>
            </div>

            <nav className="flex flex-col gap-1 flex-1">
                {navItems.map(item => {
                    const href = item.label === 'Profile' ? profileHref : item.href;
                    const active = pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active
                                ? 'bg-gray-100 text-gray-900 font-medium'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <i className={`ti ${item.icon} text-lg`} aria-hidden="true" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {user && (
                <div className="border-t border-gray-100 pt-4 mt-4">
                    <div className="flex items-center gap-3 px-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 shrink-0">
                            {user?.username?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {user.displayName || user.username}
                            </p>
                            <p className="text-xs text-gray-400 truncate">@{user.username}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                        <i className="ti ti-logout text-lg" aria-hidden="true" />
                        Sign out
                    </button>
                </div>
            )}

        </aside>
    );
}