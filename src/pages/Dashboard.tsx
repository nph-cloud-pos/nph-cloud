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

        fetchBills();

        const channel = supabase
            .channel('realtime sales')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sales' }, (payload) => {
                const newBill = payload.new as Bill;
                setBills((prev) => [newBill, ...prev]);
                // Update metrics incrementally
                setTodayTotal((prev) => prev + (newBill.amount || 0));
                setTodayGross((prev) => prev + (newBill.gross_amount || 0));
                setTodayDiscount((prev) => prev + (newBill.discount_amount || 0));
                setTotalItems((prev) => prev + (newBill.items_count || 0));
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

        setTodayTotal(total);
        setTodayGross(gross);
        setTodayDiscount(discount);
        setTotalItems(items);
        // Profit = simplified as Net - (estimated 30% cost)
        setTodayProfit(total * 0.3);
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
                {trend && (
                    <div className={`text-xs font-semibold ${trend > 0 ? 'text-green-400' : 'text-red-400'} flex items-center gap-1`}>
                        {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
        </div>
    );

    const Modal = ({ title, onClose, children }: any) => (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-auto p-8" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition">
                        <X size={24} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
            <header className="mb-10">
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent pb-1">
                    Posjet Live Monitor
                </h1>
                <p className="text-slate-400 font-medium">Comprehensive Business Analytics</p>
            </header>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <MetricCard
                    title="Total Sales"
                    value={`₹${todayGross.toLocaleString('en-IN')}`}
                    icon={BarChart3}
                    color="blue"
                    trend={12}
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
                    trend={8}
                    onClick={() => setSelectedMetric('revenue')}
                />
                <MetricCard
                    title="Estimated Profit"
                    value={`₹${todayProfit.toLocaleString('en-IN')}`}
                    icon={TrendingUp}
                    color="purple"
                    onClick={() => setSelectedMetric('profit')}
                />
            </div>

            {/* Stock Overview Section */}
            <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 border border-slate-700 rounded-2xl p-8 mb-10">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Package className="text-indigo-400" /> Stock Overview
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-slate-900/50 rounded-xl border border-slate-700">
                        <p className="text-sm text-slate-400 mb-2">Items Sold Today</p>
                        <p className="text-4xl font-bold text-blue-400">{totalItems}</p>
                    </div>
                    <div className="text-center p-6 bg-slate-900/50 rounded-xl border border-slate-700">
                        <p className="text-sm text-slate-400 mb-2">Active Products</p>
                        <p className="text-4xl font-bold text-emerald-400">--</p>
                        <p className="text-xs text-slate-500 mt-1">Sync in progress</p>
                    </div>
                    <div className="text-center p-6 bg-slate-900/50 rounded-xl border border-slate-700">
                        <p className="text-sm text-slate-400 mb-2">Low Stock Alerts</p>
                        <p className="text-4xl font-bold text-orange-400">--</p>
                        <p className="text-xs text-slate-500 mt-1">Coming soon</p>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-200">
                    <ShoppingBag className="text-blue-500" /> Recent Transactions
                </h2>

                <div className="space-y-3">
                    {bills.slice(0, 15).map((bill) => (
                        <div
                            key={bill.id}
                            className="group relative bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl flex items-center justify-between hover:bg-slate-800/80 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-blue-500/5"
                        >
                            <div className="flex items-center gap-5 flex-1">
                                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-sm border border-blue-500/20">
                                    #{bill.bill_no}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-200">{bill.customer_name || 'Walk-in Customer'}</p>
                                    <div className="flex gap-4 text-xs text-slate-500 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} /> {new Date(bill.bill_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {bill.items_count ? <span>{bill.items_count} items</span> : null}
                                        {bill.payment_mode ? <span className="uppercase">{bill.payment_mode}</span> : null}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                {bill.discount_amount && bill.discount_amount > 0 ? (
                                    <>
                                        <p className="text-sm text-slate-500 line-through">₹{(bill.gross_amount || 0).toLocaleString('en-IN')}</p>
                                        <p className="text-xl font-bold text-emerald-400">₹{bill.amount.toLocaleString('en-IN')}</p>
                                        <p className="text-xs text-orange-400">-₹{bill.discount_amount.toLocaleString('en-IN')} saved</p>
                                    </>
                                ) : (
                                    <p className="text-xl font-bold text-emerald-400">₹{bill.amount.toLocaleString('en-IN')}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modals */}
            {selectedMetric === 'sales' && (
                <Modal title="Sales Breakdown" onClose={() => setSelectedMetric(null)}>
                    <div className="space-y-4">
                        <p className="text-slate-400">Detailed sales analytics coming soon...</p>
                        <div className="bg-slate-800/50 p-4 rounded-xl">
                            <p className="text-sm text-slate-400">Total Bills: {bills.filter(b => b.bill_date.startsWith(new Date().toISOString().split('T')[0])).length}</p>
                            <p className="text-sm text-slate-400 mt-2">Gross Sales: ₹{todayGross.toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                </Modal>
            )}

            {selectedMetric === 'discounts' && (
                <Modal title="Discount Analysis" onClose={() => setSelectedMetric(null)}>
                    <div className="space-y-4">
                        <p className="text-2xl font-bold">₹{todayDiscount.toLocaleString('en-IN')}</p>
                        <p className="text-slate-400">Total discounts given today</p>
                        <div className="bg-slate-800/50 p-4 rounded-xl">
                            <p className="text-sm text-slate-400">Avg Discount per Bill: ₹{(todayDiscount / (bills.filter(b => b.bill_date.startsWith(new Date().toISOString().split('T')[0])).length || 1)).toFixed(2)}</p>
                        </div>
                    </div>
                </Modal>
            )}

            {selectedMetric === 'revenue' && (
                <Modal title="Net Revenue" onClose={() => setSelectedMetric(null)}>
                    <div className="space-y-4">
                        <p className="text-2xl font-bold text-emerald-400">₹{todayTotal.toLocaleString('en-IN')}</p>
                        <p className="text-slate-400">After discounts</p>
                    </div>
                </Modal>
            )}

            {selectedMetric === 'profit' && (
                <Modal title="Profit Estimate" onClose={() => setSelectedMetric(null)}>
                    <div className="space-y-4">
                        <p className="text-2xl font-bold text-purple-400">₹{todayProfit.toLocaleString('en-IN')}</p>
                        <p className="text-slate-400 text-sm">*Estimated at 30% margin</p>
                        <p className="text-xs text-slate-500">Note: For accurate profit tracking, purchase cost data integration is required.</p>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default App;
