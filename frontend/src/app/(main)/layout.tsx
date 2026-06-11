import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex bg-white">
            <Sidebar />
            <main className="flex-1 min-h-screen pb-16 lg:pb-0 max-w-2xl mx-auto w-full border-x border-gray-100">
                {children}
            </main>
            <div className="hidden lg:block w-80 shrink-0" />
            <BottomNav />
        </div>
    );
}