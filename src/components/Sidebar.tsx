import { Home, TrendingUp, TrendingDown, Menu, BarChart3, CreditCard, Package, Users, AlertTriangle, FileText, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        if (window.innerWidth < 768) {
            onClose();
        }
    }, [location.pathname]);

    const navItems = [
        { path: '/', label: 'Dashboard', icon: Home },
        { path: '/daily-sales', label: 'Daily Sales', icon: TrendingDown },
        { path: '/payments', label: 'Payment Analysis', icon: CreditCard },
        { path: '/stock', label: 'Stock Summary', icon: Package },
        { path: '/item-profit', label: 'Item Wise Profit', icon: TrendingUp },
        { path: '/category-profit', label: 'Category Profit', icon: BarChart3 },
        { path: '/customers', label: 'Customer Loyalty', icon: Users },
        { path: '/dead-stock', label: 'Dead Stock', icon: AlertTriangle },
        { path: '/gst', label: 'GST Register', icon: FileText },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <div className={`
                fixed top-0 left-0 h-screen bg-slate-900 border-r border-slate-800 z-50 transition-all duration-300
                ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
                md:translate-x-0 md:static
                ${collapsed ? 'md:w-20' : 'md:w-64'}
                w-64
            `}>
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    {(!collapsed || isOpen) && (
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Posjet
                        </h1>
                    )}

                    {/* Desktop Collapse Toggle */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden md:block p-2 hover:bg-slate-800 rounded-lg transition"
                    >
                        <Menu size={20} />
                    </button>

                    {/* Mobile Close Button */}
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 hover:bg-slate-800 rounded-lg transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <Icon size={20} className="min-w-[20px]" />
                                <span className={`font-medium transition-opacity duration-200 ${collapsed ? 'md:hidden' : 'block'
                                    }`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className={`flex items-center gap-2 ${collapsed ? 'md:justify-center' : ''}`}>
                        <div className="h-2 w-2 min-w-[8px] bg-emerald-500 rounded-full animate-pulse" />
                        <span className={`text-xs text-slate-500 ${collapsed ? 'md:hidden' : 'block'}`}>
                            Live Connected
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}
