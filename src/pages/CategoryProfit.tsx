import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BarChart3, TrendingUp, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CategoryData {
    category: string;
    sales: number;
    profit: number;
    margin: number;
    items_sold: number;
}

export default function CategoryProfit() {
    const [fromDate, setFromDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState<CategoryData[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Build product_name → category_name map from stock_summary
            const { data: stockData } = await supabase
                .from('stock_summary')
                .select('product_name, category_name');

            const categoryMap = new Map<string, string>();
            if (stockData) {
                stockData.forEach((s: { product_name: string; category_name: string }) => {
                    if (s.product_name && s.category_name) {
                        categoryMap.set(s.product_name.trim().toLowerCase(), s.category_name);
                    }
                });
            }

            // Fetch sale details for date range
            const { data: salesDetails, error } = await supabase
                .from('sale_details')
                .select('product_name, quantity, net_sale_amount, profit_amount, bill_date')
                .gte('bill_date', fromDate + ' 00:00:00')
                .lte('bill_date', toDate + ' 23:59:59');

            if (error) throw error;

            if (salesDetails && salesDetails.length > 0) {
                const catMap = new Map<string, { sales: number; profit: number; items: number }>();

                salesDetails.forEach((s: { product_name: string; quantity: number; net_sale_amount: number; profit_amount: number }) => {
                    const cat = categoryMap.get((s.product_name || '').trim().toLowerCase()) || 'Uncategorized';
                    if (!catMap.has(cat)) catMap.set(cat, { sales: 0, profit: 0, items: 0 });
                    const entry = catMap.get(cat)!;
                    entry.sales += Number(s.net_sale_amount) || 0;
                    entry.profit += Number(s.profit_amount) || 0;
                    entry.items += Number(s.quantity) || 0;
                });

                const result = Array.from(catMap.entries())
                    .map(([cat, vals]) => ({
                        category: cat,
                        sales: vals.sales,
                        profit: vals.profit,
                        items_sold: vals.items,
                        margin: vals.sales > 0 ? (vals.profit / vals.sales * 100) : 0
                    }))
                    .sort((a, b) => b.sales - a.sales);

                setData(result);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Category Profitability</h1>
                <p className="text-slate-400">Analysis of margins by product group</p>
            </div>

            {/* Filters */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 mb-8">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm text-slate-400 mb-2">Period</label>
                        <div className="flex gap-2">
                            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none text-sm" />
                            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none text-sm" />
                        </div>
                    </div>
                    <button onClick={fetchData} disabled={loading}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2">
                        {loading ? <RefreshCw className="animate-spin" size={18} /> : <TrendingUp size={18} />}
                        Filter
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart */}
                <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <BarChart3 className="text-blue-500" /> Sales vs Profit by Category
                    </h3>
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.slice(0, 10)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="category" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value: number | undefined) => value != null ? `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '₹0'}
                                />
                                <Bar dataKey="sales" name="Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-slate-500">
                            {loading ? <RefreshCw className="animate-spin" size={32} /> : 'No data for selected period'}
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="bg-slate-900/60 rounded-3xl border border-slate-800 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-800/50">
                            <tr>
                                <th className="text-left p-5 text-xs uppercase text-slate-500">Category</th>
                                <th className="text-right p-5 text-xs uppercase text-slate-500">Total Sales</th>
                                <th className="text-right p-5 text-xs uppercase text-slate-500">Gross Profit</th>
                                <th className="text-right p-5 text-xs uppercase text-slate-500">Margin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => (
                                <tr key={i} className="border-t border-slate-800 hover:bg-slate-800/30">
                                    <td className="p-5 font-bold">{row.category}</td>
                                    <td className="p-5 text-right">₹{row.sales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                                    <td className="p-5 text-right text-emerald-400 font-semibold">₹{row.profit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                                    <td className="p-5 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-lg font-extrabold text-blue-400">{row.margin.toFixed(1)}%</span>
                                            <div className="w-full max-w-[80px] bg-slate-800 h-1 rounded-full mt-1">
                                                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(Math.max(row.margin, 0), 100)}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {data.length === 0 && !loading && (
                        <div className="p-20 text-center text-slate-500">
                            <p>No sales data found for the selected period.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
