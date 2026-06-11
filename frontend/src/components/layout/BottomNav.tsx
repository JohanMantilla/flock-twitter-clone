'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
    { href: '/home', icon: 'ti-home', label: 'Home' },
    { href: '/search', icon: 'ti-search', label: 'Search' },
    { href: '/profile', icon: 'ti-user', label: 'Profile' },
];

export function BottomNav() {
    const pathname = usePathname();
    const { user } = useAuth();

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-50">
            {navItems.map(item => {
                const href = item.label === 'Profile' && user
                    ? `/profile/${user.username}`
                    : item.href;
                const active = pathname.startsWith(item.href);

                return (
                    <Link
                        key={item.href}
                        href={href}
                        aria-label={item.label}
                        className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${active ? 'text-gray-900' : 'text-gray-400'
                            }`}
                    >
                        <i className={`ti ${item.icon} text-xl`} aria-hidden="true" />
                        <span className="text-xs">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}