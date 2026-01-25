import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Calendar, TrendingUp, ShoppingBag, DollarSign, Download } from 'lucide-react';

interface DailySales {
    date: string;
    bills_count: number;
    gross_sales: number;
    discount_amount: number;
    net_sales: number;
    items_sold: number;
    avg_bill_value: number;
}

export default function DailySales() {
    const [fromDate, setFromDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState<DailySales[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: salesData } = await supabase
                .from('sales')
                .select('bill_date, amount, gross_amount, discount_amount, items_count')
                .gte('bill_date', fromDate + ' 00:00:00')
                .lte('bill_date', toDate + ' 23:59:59')
                .order('bill_date', { ascending: true });

            if (salesData && salesData.length > 0) {
                // Group by date
                const grouped = salesData.reduce((acc: any, record: any) => {
                    const date = record.bill_date.split('T')[0];
                    if (!acc[date]) {
                        acc[date] = {
                            date,
                            bills_count: 0,
                            gross_sales: 0,
                            discount_amount: 0,
                            net_sales: 0,
                            items_sold: 0
                        };
                    }
                    acc[date].bills_count += 1;
                    acc[date].gross_sales += Number(record.gross_amount) || Number(record.amount) || 0;
                    acc[date].discount_amount += Number(record.discount_amount) || 0;
                    acc[date].net_sales += Number(record.amount) || 0;
                    acc[date].items_sold += Number(record.items_count) || 0;
                    return acc;
                }, {});

                const result = Object.values(grouped).map((item: any) => ({
                    ...item,
                    avg_bill_value: item.bills_count > 0 ? item.net_sales / item.bills_count : 0
                }));

                setData(result as DailySales[]);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error('Error:', error);
            setData([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const totals = data.reduce((acc, curr) => ({
        bills: acc.bills + curr.bills_count,
        gross: acc.gross + curr.gross_sales,
        discount: acc.discount + curr.discount_amount,
        net: acc.net + curr.net_sales,
        items: acc.items + curr.items_sold
    }), { bills: 0, gross: 0, discount: 0, net: 0, items: 0 });

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Daily Sales Summary</h1>
                <p className="text-slate-400">Track revenue and performance by day</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-3 mb-2">
                        <ShoppingBag className="text-blue-400" size={24} />
                        <p className="text-xs text-slate-500 uppercase">Total Bills</p>
                    </div>
                    <p className="text-3xl font-bold">{totals.bills.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="text-emerald-400" size={24} />
                        <p className="text-xs text-slate-500 uppercase">Net Sales</p>
                    </div>
                    <p className="text-3xl font-bold text-emerald-400">₹{totals.net.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="text-orange-400" size={24} />
                        <p className="text-xs text-slate-500 uppercase">Discounts</p>
                    </div>
                    <p className="text-3xl font-bold text-orange-400">₹{totals.discount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-3 mb-2">
                        <ShoppingBag className="text-purple-400" size={24} />
                        <p className="text-xs text-slate-500 uppercase">Items Sold</p>
                    </div>
                    <p className="text-3xl font-bold text-purple-400">{totals.items.toLocaleString('en-IN')}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 mb-8">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
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
                    <div className="flex-1 min-w-[200px]">
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
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 px-6 py-2 rounded-lg font-semibold transition"
                    >
                        {loading ? 'Loading...' : 'Generate Report'}
                    </button>
                    <button
                        onClick={() => {
                            const csv = [
                                ['Date', 'Bills', 'Gross Sales', 'Discounts', 'Net Sales', 'Items Sold', 'Avg Bill'],
                                ...data.map(d => [d.date, d.bills_count, d.gross_sales, d.discount_amount, d.net_sales, d.items_sold, d.avg_bill_value.toFixed(2)])
                            ].map(row => row.join(',')).join('\n');
                            const blob = new Blob([csv], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `daily-sales-${fromDate}-to-${toDate}.csv`;
                            a.click();
                        }}
                        className="bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2"
                    >
                        <Download size={18} /> Export
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-800/50">
                            <tr>
                                <th className="text-left p-4 text-sm font-semibold">Date</th>
                                <th className="text-right p-4 text-sm font-semibold">Bills</th>
                                <th className="text-right p-4 text-sm font-semibold">Gross Sales</th>
                                <th className="text-right p-4 text-sm font-semibold">Discounts</th>
                                <th className="text-right p-4 text-sm font-semibold">Net Sales</th>
                                <th className="text-right p-4 text-sm font-semibold">Items</th>
                                <th className="text-right p-4 text-sm font-semibold">Avg Bill</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => (
                                <tr key={i} className="border-t border-slate-800 hover:bg-slate-800/30">
                                    <td className="p-4 font-medium">{new Date(row.date).toLocaleDateString('en-IN')}</td>
                                    <td className="p-4 text-right">{row.bills_count}</td>
                                    <td className="p-4 text-right text-blue-400">₹{row.gross_sales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                                    <td className="p-4 text-right text-orange-400">₹{row.discount_amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                                    <td className="p-4 text-right text-emerald-400 font-semibold">₹{row.net_sales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                                    <td className="p-4 text-right">{row.items_sold}</td>
                                    <td className="p-4 text-right text-purple-400">₹{row.avg_bill_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {data.length === 0 && !loading && (
                    <div className="text-center py-12 text-slate-500">
                        <p>No data for selected date range.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
