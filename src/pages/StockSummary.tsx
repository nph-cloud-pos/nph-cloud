import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AlertTriangle, Search, TrendingDown, DollarSign } from 'lucide-react';

interface StockItem {
    product_name: string;
    category_name: string;
    current_stock: number;
    stock_value: number;
    reorder_min: number;
    days_since_sale: number;
}

export default function StockSummary() {
    const [data, setData] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showLowStock, setShowLowStock] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const { data: stockData, error } = await supabase
            .from('stock_summary')
            .select('*')
            .order('current_stock', { ascending: true });

        if (error) throw error;
        setData(stockData || []);
    } catch (error) {
        console.error('Error:', error);
    }
    setLoading(false);
};

useEffect(() => {
    fetchData();
}, []);

const filteredData = data.filter(item => {
    const matchesSearch = item.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLowStock = !showLowStock || (item.current_stock < item.reorder_min);
    return matchesSearch && matchesLowStock;
});

const totalValue = data.reduce((sum, item) => sum + (Number(item.stock_value) || 0), 0);
const lowStockCount = data.filter(item => item.current_stock < item.reorder_min).length;

return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
        <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Stock Summary & Inventory</h1>
            <p className="text-slate-400">Real-time stock levels and valuation</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="text-blue-400" size={24} />
                    <p className="text-xs text-slate-500 uppercase">Total Inventory Value</p>
                </div>
                <p className="text-3xl font-bold text-blue-400">₹{totalValue.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="text-orange-400" size={24} />
                    <p className="text-xs text-slate-500 uppercase">Low Stock Items</p>
                </div>
                <p className="text-3xl font-bold text-orange-400">{lowStockCount}</p>
            </div>
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3 mb-2">
                    <TrendingDown className="text-purple-400" size={24} />
                    <p className="text-xs text-slate-500 uppercase">Dead Stock Value</p>
                </div>
                <p className="text-3xl font-bold text-purple-400">₹{data.filter(i => i.days_since_sale > 90).reduce((s, i) => s + i.stock_value, 0).toLocaleString('en-IN')}</p>
            </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 focus:border-blue-500 transition"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button
                onClick={() => setShowLowStock(!showLowStock)}
                className={`px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${showLowStock ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
            >
                <AlertTriangle size={20} />
                {showLowStock ? 'Showing Low Stock' : 'Filter Low Stock'}
            </button>
        </div>

        {/* Table */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-800/50 text-slate-400">
                        <tr>
                            <th className="text-left p-4 text-sm font-semibold">Product Name</th>
                            <th className="text-left p-4 text-sm font-semibold">Category</th>
                            <th className="text-right p-4 text-sm font-semibold">Stock</th>
                            <th className="text-right p-4 text-sm font-semibold">Value</th>
                            <th className="text-right p-4 text-sm font-semibold">Aging</th>
                            <th className="text-center p-4 text-sm font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((item, i) => (
                            <tr key={i} className="border-t border-slate-800 hover:bg-slate-800/30">
                                <td className="p-4 font-medium">{item.product_name}</td>
                                <td className="p-4 text-sm text-slate-400">{item.category_name}</td>
                                <td className="p-4 text-right font-bold">{item.current_stock.toFixed(2)}</td>
                                <td className="p-4 text-right text-emerald-400">₹{item.stock_value.toLocaleString('en-IN')}</td>
                                <td className="p-4 text-right text-sm text-slate-400">
                                    {item.days_since_sale > 365 ? '1y+' : `${item.days_since_sale}d`}
                                </td>
                                <td className="p-4 text-center">
                                    {item.current_stock < item.reorder_min ? (
                                        <span className="bg-red-900/30 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/20">LOW</span>
                                    ) : (
                                        <span className="bg-emerald-900/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">OK</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);
}
