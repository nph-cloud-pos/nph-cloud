import { Home, TrendingUp, TrendingDown, Menu, BarChart3, CreditCard, Package, Users, AlertTriangle, FileText } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function Sidebar() {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

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
        <div className={`${collapsed ? 'w-20' : 'w-64'} bg-slate-900 border-r border-slate-800 h-screen fixed left-0 top-0 transition-all duration-300 flex flex-col`}>
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                {!collapsed && (
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Posjet
                    </h1>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition"
                >
                    <Menu size={20} />
                </button>
            </div>

            <nav className="flex-1 p-4 space-y-2">
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
                            <Icon size={20} />
                            {!collapsed && <span className="font-medium">{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
                    <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                    {!collapsed && <span className="text-xs text-slate-500">Live</span>}
                </div>
            </div>
        </div>
    );
}
