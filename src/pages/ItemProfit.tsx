import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Calendar, Download, TrendingUp, RefreshCw } from 'lucide-react';

interface ProductProfit {
    product_name: string;
    total_quantity: number;
    total_landing_cost: number;
    total_sales: number;
    total_profit: number;
    profit_percent: number;
}

export default function ItemProfit() {
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState<ProductProfit[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: saleDetailsData, error } = await supabase
                .from('sale_details')
                .select('*')
                .gte('bill_date', fromDate + ' 00:00:00')
                .lte('bill_date', toDate + ' 23:59:59');

            if (error) {
                console.error('Supabase error:', error);
                setData([]);
                return;
            }

            if (saleDetailsData && saleDetailsData.length > 0) {
                // Aggregate by product
                const productMap = new Map<string, ProductProfit>();

                saleDetailsData.forEach((item: any) => {
                    const productName = item.product_name || 'Unknown Product';

                    if (!productMap.has(productName)) {
                        productMap.set(productName, {
                            product_name: productName,
                            total_quantity: 0,
                            total_landing_cost: 0,
                            total_sales: 0,
                            total_profit: 0,
                            profit_percent: 0
                        });
                    }

                    const product = productMap.get(productName)!;
                    product.total_quantity += Number(item.quantity) || 0;
                    product.total_landing_cost += (Number(item.landing_cost) || 0) * (Number(item.quantity) || 0);
                    product.total_sales += Number(item.net_sale_amount) || 0;
                    product.total_profit += Number(item.profit_amount) || 0;
                });

                // Calculate profit percentages
                const aggregatedData = Array.from(productMap.values()).map(product => ({
                    ...product,
                    profit_percent: product.total_sales > 0
                        ? (product.total_profit / product.total_sales * 100)
                        : 0
                }));

                // Sort by profit descending
                aggregatedData.sort((a, b) => b.total_profit - a.total_profit);

                setData(aggregatedData);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setData([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const totalSales = data.reduce((sum, item) => sum + item.total_sales, 0);
    const totalProfit = data.reduce((sum, item) => sum + item.total_profit, 0);
    const avgMargin = totalSales > 0 ? (totalProfit / totalSales * 100) : 0;

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Item Wise Profit Report</h1>
                <p className="text-sm md:text-base text-slate-400">Analyze product profitability over time</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                <div className="bg-slate-900/60 backdrop-blur-xl p-4 md:p-6 rounded-2xl border border-slate-800">
                    <p className="text-xs text-slate-500 uppercase mb-2">Total Sales</p>
                    <p className="text-2xl md:text-3xl font-bold text-blue-400">₹{totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-xl p-4 md:p-6 rounded-2xl border border-slate-800">
                    <p className="text-xs text-slate-500 uppercase mb-2">Total Profit</p>
                    <p className="text-2xl md:text-3xl font-bold text-emerald-400">₹{totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-xl p-4 md:p-6 rounded-2xl border border-slate-800">
                    <p className="text-xs text-slate-500 uppercase mb-2">Avg Margin</p>
                    <p className="text-2xl md:text-3xl font-bold text-purple-400">{avgMargin.toFixed(1)}%</p>
                </div>
            </div>

            {/* Date Filter */}
            <div className="bg-slate-900/60 backdrop-blur-xl p-4 md:p-6 rounded-2xl border border-slate-800 mb-6 md:mb-8">
                <div className="flex flex-col md:flex-row flex-wrap gap-4 items-end">
                    <div className="w-full md:flex-1 min-w-[200px]">
                        <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
                            <Calendar size={16} /> From Date
                        </label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                    <div className="w-full md:flex-1 min-w-[200px]">
                        <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
                            <Calendar size={16} /> To Date
                        </label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="flex-1 md:flex-none bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 px-6 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                        >
                            {loading ? <RefreshCw size={18} className="animate-spin" /> : <TrendingUp size={18} />}
                            {loading ? 'Loading...' : 'Generate Report'}
                        </button>
                        <button
                            onClick={() => {
                                const csv = [
                                    ['Product Name', 'Qty Sold', 'Landing Cost', 'Sales Amount', 'Profit', 'Profit %'],
                                    ...data.map(item => [
                                        item.product_name,
                                        item.total_quantity,
                                        item.total_landing_cost.toFixed(2),
                                        item.total_sales.toFixed(2),
                                        item.total_profit.toFixed(2),
                                        item.profit_percent.toFixed(2)
                                    ])
                                ].map(row => row.join(',')).join('\n');

                                const blob = new Blob([csv], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `item-profit-${fromDate}-to-${toDate}.csv`;
                                a.click();
                            }}
                            className="flex-1 md:flex-none bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                        >
                            <Download size={18} />
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead className="bg-slate-800/50">
                            <tr>
                                <th className="text-left p-4 text-sm font-semibold text-slate-300">Product Name</th>
                                <th className="text-right p-4 text-sm font-semibold text-slate-300">Qty Sold</th>
                                <th className="text-right p-4 text-sm font-semibold text-slate-300">Landing Cost</th>
                                <th className="text-right p-4 text-sm font-semibold text-slate-300">Sales Amount</th>
                                <th className="text-right p-4 text-sm font-semibold text-slate-300">Profit</th>
                                <th className="text-right p-4 text-sm font-semibold text-slate-300">Profit %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, index) => (
                                <tr key={index} className="border-t border-slate-800 hover:bg-slate-800/30 transition">
                                    <td className="p-4 font-medium">{item.product_name}</td>
                                    <td className="p-4 text-right text-slate-300">{item.total_quantity.toFixed(3)}</td>
                                    <td className="p-4 text-right text-orange-400">₹{item.total_landing_cost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="p-4 text-right text-blue-400">₹{item.total_sales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="p-4 text-right text-emerald-400 font-semibold">₹{item.total_profit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="p-4 text-right">
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${item.profit_percent > 30 ? 'bg-emerald-900/30 text-emerald-400' :
                                            item.profit_percent > 15 ? 'bg-blue-900/30 text-blue-400' :
                                                item.profit_percent > 0 ? 'bg-yellow-900/30 text-yellow-400' :
                                                    'bg-red-900/30 text-red-400'
                                            }`}>
                                            {item.profit_percent.toFixed(1)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {data.length === 0 && !loading && (
                    <div className="text-center py-12 text-slate-500">
                        <p className="text-lg mb-2">No data available for the selected date range.</p>
                        <p className="text-sm">Please ensure:</p>
                        <ol className="text-sm mt-3 space-y-1 text-left max-w-md mx-auto">
                            <li>1. The <code className="bg-slate-800 px-2 py-1 rounded">sale_details</code> table exists in Supabase</li>
                            <li>2. The product sync script is running: <code className="bg-slate-800 px-2 py-1 rounded">sync_product_data.ps1</code></li>
                            <li>3. There are sales in the selected date range</li>
                        </ol>
                    </div>
                )}

                {loading && (
                    <div className="text-center py-12">
                        <RefreshCw className="animate-spin mx-auto mb-3 text-blue-400" size={32} />
                        <p className="text-slate-400">Loading product data...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
