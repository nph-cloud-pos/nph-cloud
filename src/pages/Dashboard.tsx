import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BadgeIndianRupee, ShoppingBag, Clock, TrendingUp, TrendingDown, Package, X, BarChart3, Percent } from 'lucide-react';

interface Bill {
    id: number;
    bill_no: string;
    bill_date: string;
    amount: number;
    customer_name: string;
    gross_amount?: number;
    discount_amount?: number;
    discount_percent?: number;
    items_count?: number;
    pieces_count?: number;
    payment_mode?: string;
    profit?: number;
}

function App() {
    const [bills, setBills] = useState<Bill[]>([]);
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

    // Calculated metrics
    const [todayTotal, setTodayTotal] = useState(0);
    const [todayGross, setTodayGross] = useState(0);
    const [todayDiscount, setTodayDiscount] = useState(0);
    const [todayProfit, setTodayProfit] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    // Yesterday metrics for trend
    const [yesterdayGross, setYesterdayGross] = useState(0);
    const [yesterdayTotal, setYesterdayTotal] = useState(0);

    // Stock overview
    const [activeProducts, setActiveProducts] = useState<number | null>(null);
    const [lowStockCount, setLowStockCount] = useState<number | null>(null);

    useEffect(() => {
        const fetchBills = async () => {
            const { data } = await supabase
                .from('sales')
                .select('*')
                .order('bill_date', { ascending: false })
                .limit(50);

            if (data) {
                setBills(data);
                calculateMetrics(data);
            }
        };

        const fetchYesterdayMetrics = async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yDate = yesterday.toISOString().split('T')[0];

            const { data } = await supabase
                .from('sales')
                .select('amount, gross_amount')
                .gte('bill_date', yDate + ' 00:00:00')
                .lte('bill_date', yDate + ' 23:59:59');

            if (data) {
                const yGross = data.reduce((s, b) => s + (Number(b.gross_amount) || Number(b.amount) || 0), 0);
                const yNet = data.reduce((s, b) => s + (Number(b.amount) || 0), 0);
                setYesterdayGross(yGross);
                setYesterdayTotal(yNet);
            }
        };

        const fetchStockOverview = async () => {
            const { data, count } = await supabase
                .from('stock_summary')
                .select('current_stock, reorder_min', { count: 'exact' });

            if (data) {
                setActiveProducts(count ?? data.length);
                const low = data.filter(i => Number(i.current_stock) < Number(i.reorder_min) && Number(i.reorder_min) > 0).length;
                setLowStockCount(low);
            }
        };

        fetchBills();
        fetchYesterdayMetrics();
        fetchStockOverview();

        const channel = supabase
            .channel('realtime sales')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sales' }, (payload) => {
                const newBill = payload.new as Bill;

                setBills((prev) => {
                    const updated = [newBill, ...prev];
                    return updated.sort((a, b) => new Date(b.bill_date).getTime() - new Date(a.bill_date).getTime());
                });

                const today = new Date().toISOString().split('T')[0];
                if (newBill.bill_date.startsWith(today)) {
                    setTodayTotal((prev) => prev + (newBill.amount || 0));
                    setTodayGross((prev) => prev + (newBill.gross_amount || 0));
                    setTodayDiscount((prev) => prev + (newBill.discount_amount || 0));
                    setTodayProfit((prev) => prev + (newBill.profit || 0));
                    setTotalItems((prev) => prev + (newBill.items_count || 0));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const calculateMetrics = (data: Bill[]) => {
        const today = new Date().toISOString().split('T')[0];
        const todayBills = data.filter(bill => bill.bill_date.startsWith(today));

        const total = todayBills.reduce((sum, bill) => sum + (bill.amount || 0), 0);
        const gross = todayBills.reduce((sum, bill) => sum + (bill.gross_amount || bill.amount || 0), 0);
        const discount = todayBills.reduce((sum, bill) => sum + (bill.discount_amount || 0), 0);
        const items = todayBills.reduce((sum, bill) => sum + (bill.items_count || 0), 0);
        const profit = todayBills.reduce((sum, bill) => sum + (bill.profit || 0), 0);

        setTodayTotal(total);
        setTodayGross(gross);
        setTodayDiscount(discount);
        setTotalItems(items);
        setTodayProfit(profit);
    };

    const calcTrend = (today: number, yesterday: number) => {
        if (yesterday === 0) return null;
        return Math.round(((today - yesterday) / yesterday) * 100);
    };

    const MetricCard = ({ title, value, icon: Icon, color, onClick, trend }: any) => (
        <div
            onClick={onClick}
            className={`bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 hover:border-${color}-500/50 transition-all cursor-pointer hover:scale-105 hover:shadow-xl hover:shadow-${color}-500/10`}
        >
            <div className="flex items-center justify-between mb-3">
                <div className={`p-3 bg-${color}-500/10 rounded-xl`}>
                    <Icon className={`text-${color}-400`} size={24} />
                </div>
                {trend != null && (
                    <div className={`text-xs font-semibold ${trend >= 0 ? 'text-green-400' : 'text-red-400'} flex items-center gap-1`}>
                        {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
        </div>
    );

    // Bill Details Modal State
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
    const [billItems, setBillItems] = useState<any[]>([]);
    const [loadingBillItems, setLoadingBillItems] = useState(false);

    const fetchBillDetails = async (bill: Bill) => {
        setSelectedBill(bill);
        setLoadingBillItems(true);
        const { data } = await supabase
            .from('sale_details')
            .select('*')
            .eq('bill_no', bill.bill_no);

        if (data) {
            setBillItems(data);
        }
        setLoadingBillItems(false);
    };

    const BillDetailsModal = ({ bill, items, onClose }: { bill: Bill, items: any[], onClose: () => void }) => {
        if (!bill) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />
                <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg md:max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                    <div className="p-4 md:p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <ShoppingBag className="text-blue-500" size={20} />
                                Bill Details #{bill.bill_no}
                            </h2>
                            <p className="text-sm text-slate-400 mt-1">
                                {new Date(bill.bill_date).toLocaleString('en-IN')} • {bill.customer_name}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                        {loadingBillItems ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-slate-950/50 rounded-xl border border-slate-800 overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-800/50 text-slate-400 font-medium">
                                            <tr>
                                                <th className="p-3">Item</th>
                                                <th className="p-3 text-right">Qty</th>
                                                <th className="p-3 text-right">Rate</th>
                                                <th className="p-3 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {items.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-800/20">
                                                    <td className="p-3 font-medium text-slate-200">
                                                        {item.product_name || 'Unknown Item'}
                                                    </td>
                                                    <td className="p-3 text-right text-slate-400">
                                                        {Number(item.quantity)}
                                                    </td>
                                                    <td className="p-3 text-right text-slate-400">
                                                        ₹{Number(item.sale_rate).toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="p-3 text-right font-medium text-slate-200">
                                                        ₹{Number(item.net_sale_amount).toLocaleString('en-IN')}
                                                    </td>
                                                </tr>
                                            ))}
                                            {items.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-slate-500">
                                                        No items found for this bill.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <div className="w-full sm:w-1/2 space-y-2">
                                        <div className="flex justify-between text-sm text-slate-400">
                                            <span>Gross Amount</span>
                                            <span>₹{bill.gross_amount?.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-orange-400">
                                            <span>Discount</span>
                                            <span>-₹{bill.discount_amount?.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="pt-2 border-t border-slate-800 flex justify-between text-lg font-bold text-emerald-400">
                                            <span>Net Total</span>
                                            <span>₹{bill.amount.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const salesTrend = calcTrend(todayGross, yesterdayGross);
    const revenueTrend = calcTrend(todayTotal, yesterdayTotal);

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                        <ShoppingBag className="text-blue-500" /> Posjet Analytics
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Real-time Business Monitor</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Current Time</p>
                    <p className="text-xl font-bold text-slate-300 font-mono">
                        {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </p>
                </div>
            </header>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-10">
                <MetricCard
                    title="Total Sales"
                    value={`₹${todayGross.toLocaleString('en-IN')}`}
                    icon={BarChart3}
                    color="blue"
                    trend={salesTrend}
                    onClick={() => setSelectedMetric('sales')}
                />
                <MetricCard
                    title="Discounts Given"
                    value={`₹${todayDiscount.toLocaleString('en-IN')}`}
                    icon={Percent}
                    color="orange"
                    onClick={() => setSelectedMetric('discounts')}
                />
                <MetricCard
                    title="Net Revenue"
                    value={`₹${todayTotal.toLocaleString('en-IN')}`}
                    icon={BadgeIndianRupee}
                    color="emerald"
                    trend={revenueTrend}
                    onClick={() => setSelectedMetric('revenue')}
                />
                <MetricCard
                    title="Real Net Profit"
                    value={`₹${todayProfit.toLocaleString('en-IN')}`}
                    icon={TrendingUp}
                    color="purple"
                    onClick={() => setSelectedMetric('profit')}
                />
            </div>

            {/* Stock Overview Section */}
            <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 border border-slate-700 rounded-2xl p-4 md:p-8 mb-6 md:mb-10">
                <h2 className="text-lg md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-3">
                    <Package className="text-indigo-400" /> Stock Overview
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                    <div className="text-center p-4 md:p-6 bg-slate-900/50 rounded-xl border border-slate-700">
                        <p className="text-xs md:text-sm text-slate-400 mb-2">Items Sold Today</p>
                        <p className="text-2xl md:text-4xl font-bold text-blue-400">{totalItems}</p>
                    </div>
                    <div className="text-center p-4 md:p-6 bg-slate-900/50 rounded-xl border border-slate-700">
                        <p className="text-xs md:text-sm text-slate-400 mb-2">Active Products</p>
                        <p className="text-2xl md:text-4xl font-bold text-emerald-400">
                            {activeProducts !== null ? activeProducts.toLocaleString('en-IN') : '--'}
                        </p>
                    </div>
                    <div className="text-center p-4 md:p-6 bg-slate-900/50 rounded-xl border border-slate-700">
                        <p className="text-xs md:text-sm text-slate-400 mb-2">Low Stock Alerts</p>
                        <p className={`text-2xl md:text-4xl font-bold ${lowStockCount && lowStockCount > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                            {lowStockCount !== null ? lowStockCount : '--'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="space-y-6">
                <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 text-slate-200">
                    <ShoppingBag className="text-blue-500" /> Recent Transactions
                </h2>

                <div className="space-y-3">
                    {bills.slice(0, 15).map((bill) => (
                        <div
                            key={bill.id}
                            onClick={() => fetchBillDetails(bill)}
                            className="group relative bg-slate-900/40 border border-slate-800/60 p-4 md:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-slate-800/80 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-blue-500/5 gap-3 sm:gap-0 cursor-pointer"
                        >
                            <div className="flex items-center gap-4 md:gap-5 flex-1 w-full sm:w-auto">
                                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-xs md:text-sm border border-blue-500/20 shrink-0">
                                    #{bill.bill_no}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-200 truncate">{bill.customer_name || 'Walk-in Customer'}</p>
                                    <div className="flex flex-wrap gap-2 md:gap-4 text-xs text-slate-500 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} /> {new Date(bill.bill_date).toLocaleString('en-IN', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: true
                                            })}
                                        </span>
                                        {bill.items_count ? <span>{bill.items_count} items</span> : null}
                                        {bill.payment_mode ? <span className="uppercase">{bill.payment_mode}</span> : null}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right w-full sm:w-auto pl-14 sm:pl-0">
                                {bill.discount_amount && bill.discount_amount > 0 ? (
                                    <>
                                        <p className="text-xs md:text-sm text-slate-500 line-through">₹{(bill.gross_amount || 0).toLocaleString('en-IN')}</p>
                                        <p className="text-lg md:text-xl font-bold text-emerald-400">₹{bill.amount.toLocaleString('en-IN')}</p>
                                        <p className="text-[10px] md:text-xs text-orange-400">-₹{bill.discount_amount.toLocaleString('en-IN')} saved</p>
                                    </>
                                ) : (
                                    <p className="text-lg md:text-xl font-bold text-emerald-400">₹{bill.amount.toLocaleString('en-IN')}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bill Details Modal */}
            <BillDetailsModal
                bill={selectedBill!}
                items={billItems}
                onClose={() => setSelectedBill(null)}
            />

            {/* Modals - Metrics */}
            {selectedMetric === 'sales' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMetric(null)}>
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">Sales Breakdown</h3>
                        <div className="space-y-4">
                            <div className="bg-slate-800/50 p-4 rounded-xl">
                                <p className="text-sm text-slate-400">Total Bills Today</p>
                                <p className="text-2xl font-bold">{bills.filter(b => b.bill_date.startsWith(new Date().toISOString().split('T')[0])).length}</p>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-xl">
                                <p className="text-sm text-slate-400">Gross Sales</p>
                                <p className="text-2xl font-bold">₹{todayGross.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedMetric(null)} className="mt-6 w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition">Close</button>
                    </div>
                </div>
            )}

            {selectedMetric === 'discounts' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMetric(null)}>
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">Discount Analysis</h3>
                        <div className="space-y-4">
                            <p className="text-2xl font-bold text-orange-400">₹{todayDiscount.toLocaleString('en-IN')}</p>
                            <p className="text-slate-400">Total discounts given today</p>
                        </div>
                        <button onClick={() => setSelectedMetric(null)} className="mt-6 w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition">Close</button>
                    </div>
                </div>
            )}

            {selectedMetric === 'revenue' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMetric(null)}>
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">Net Revenue</h3>
                        <div className="space-y-4">
                            <p className="text-2xl font-bold text-emerald-400">₹{todayTotal.toLocaleString('en-IN')}</p>
                            <p className="text-slate-400">Total revenue after all discounts</p>
                        </div>
                        <button onClick={() => setSelectedMetric(null)} className="mt-6 w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition">Close</button>
                    </div>
                </div>
            )}

            {selectedMetric === 'profit' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMetric(null)}>
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">Profit Analysis</h3>
                        <div className="space-y-4">
                            <p className="text-2xl font-bold text-purple-400">₹{todayProfit.toLocaleString('en-IN')}</p>
                            <p className="text-slate-400 text-sm">Based on Landing Cost vs Sale Rate.</p>
                            <p className="text-xs text-slate-500">Includes accurate product-level profit calculations.</p>
                        </div>
                        <button onClick={() => setSelectedMetric(null)} className="mt-6 w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
