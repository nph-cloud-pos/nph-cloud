import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AlertTriangle, TrendingDown, Clock, Package } from 'lucide-react';

interface DeadItem {
    product_name: string;
    category_name: string;
    current_stock: number;
    stock_value: number;
    days_since_sale: number;
    last_sale_date: string;
}

export default function DeadStock() {
    const [data, setData] = useState<DeadItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [threshold, setThreshold] = useState(90); // default 90 days

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: stockData, error } = await supabase
                .from('stock_summary')
                .select('*')
                .gt('days_since_sale', threshold)
                .gt('current_stock', 0)
                .order('days_since_sale', { ascending: false });

            if (error) throw error;
            setData(stockData || []);
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [threshold]);

    const totalDeadValue = data.reduce((sum, item) => sum + (Number(item.stock_value) || 0), 0);

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Dead Stock Analysis</h1>
                <p className="text-slate-400">Inventory with no sales activity</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-1/4 space-y-6">
                    <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                        <h3 className="text-xs text-slate-500 uppercase font-bold mb-4 tracking-wider">Parameters</h3>
                        <label className="block text-sm mb-2 text-slate-300">Days Since Last Sale</label>
                        <input
                            type="range" min="30" max="365" step="30"
                            value={threshold}
                            onChange={(e) => setThreshold(Number(e.target.value))}
                            className="w-full mb-2 accent-blue-500"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mb-6">
                            <span>30d</span>
                            <span className="text-blue-400 font-bold bg-blue-400/10 px-2 py-1 rounded">Miminum {threshold} Days</span>
                            <span>365d</span>
                        </div>

                        <div className="pt-4 border-t border-slate-800">
                            <div className="flex items-center gap-3 mb-2">
                                <Package className="text-orange-400" size={18} />
                                <p className="text-xs text-slate-500">Items Affected</p>
                            </div>
                            <p className="text-2xl font-bold">{data.length}</p>
                        </div>
                        <div className="pt-4 mt-4 border-t border-slate-800">
                            <div className="flex items-center gap-3 mb-2">
                                <TrendingDown className="text-red-400" size={18} />
                                <p className="text-xs text-slate-500">Capital Blocked</p>
                            </div>
                            <p className="text-2xl font-bold text-red-500">₹{totalDeadValue.toLocaleString('en-IN')}</p>
                        </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
                        <h4 className="text-sm font-bold text-blue-400 mb-2">Recoomendation</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Consider running clearance sales or bundle offers for these items to release blocked capital.
                        </p>
                    </div>
                </div>

                <div className="lg:w-3/4">
                    <div className="bg-slate-900/60 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
                        <table className="w-full">
                            <thead className="bg-slate-800/50">
                                <tr>
                                    <th className="text-left p-5 text-xs font-bold uppercase tracking-widest text-slate-500">Product</th>
                                    <th className="text-center p-5 text-xs font-bold uppercase tracking-widest text-slate-500">Stock</th>
                                    <th className="text-right p-5 text-xs font-bold uppercase tracking-widest text-slate-500">Value Blocked</th>
                                    <th className="text-right p-5 text-xs font-bold uppercase tracking-widest text-slate-500">Inactive For</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {data.map((item, i) => (
                                    <tr key={i} className="hover:bg-slate-800/30 transition group">
                                        <td className="p-5">
                                            <p className="font-semibold text-slate-200 group-hover:text-blue-400 transition">{item.product_name}</p>
                                            <p className="text-xs text-slate-500">{item.category_name}</p>
                                        </td>
                                        <td className="p-5 text-center font-medium">{item.current_stock.toFixed(0)}</td>
                                        <td className="p-5 text-right font-bold text-orange-400">₹{item.stock_value.toLocaleString('en-IN')}</td>
                                        <td className="p-5 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-bold text-slate-400 flex items-center gap-1">
                                                    <Clock size={12} className="text-slate-600" /> {item.days_since_sale} Days
                                                </span>
                                                <span className="text-[10px] text-slate-600 uppercase">Last: {item.last_sale_date ? new Date(item.last_sale_date).toLocaleDateString() : 'Never'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {data.length === 0 && !loading && (
                            <div className="p-20 text-center text-slate-500">
                                <AlertTriangle size={40} className="mx-auto mb-4 opacity-20" />
                                <p>No dead stock found for this threshold.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
