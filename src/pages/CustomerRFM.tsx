import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Users, Search, Award, AlertCircle } from 'lucide-react';

interface CustomerSummary {
    customer_name: string;
    phone: string;
    total_visits: number;
    total_spent: number;
    avg_transaction_value: number;
    recency_days: number;
    rfm_segment: string;
}

export default function CustomerRFM() {
    const [data, setData] = useState<CustomerSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSegment, setSelectedSegment] = useState('All');

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: customerData, error } = await supabase
                .from('customer_summary')
                .select('*')
                .order('total_spent', { ascending: false });

            if (error) throw error;
            setData(customerData || []);
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredData = data.filter(c => {
        const matchesSearch = c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.phone && c.phone.includes(searchTerm));
        const matchesSegment = selectedSegment === 'All' || c.rfm_segment === selectedSegment;
        return matchesSearch && matchesSegment;
    });

    const segments = ['All', 'Champion', 'Loyal', 'New/Occasional', 'At Risk', 'Lost'];

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Customer RFM Analysis</h1>
                <p className="text-slate-400">Recency, Frequency, and Monetary behavior segments</p>
            </div>

            {/* Segment Filter Pins */}
            <div className="flex flex-wrap gap-2 mb-8">
                {segments.map(seg => (
                    <button
                        key={seg}
                        onClick={() => setSelectedSegment(seg)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition ${selectedSegment === seg ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                            }`}
                    >
                        {seg}
                        <span className="ml-2 opacity-60">({data.filter(c => seg === 'All' || c.rfm_segment === seg).length})</span>
                    </button>
                ))}
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or phone..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 focus:border-blue-500 transition"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Customer List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredData.map((cust, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-blue-500/30 transition shadow-lg group">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg group-hover:text-blue-400 transition">{cust.customer_name}</h3>
                                <p className="text-sm text-slate-500">{cust.phone || 'No phone'}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cust.rfm_segment === 'Champion' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/20' :
                                cust.rfm_segment === 'Loyal' ? 'bg-blue-900/30 text-blue-400 border border-blue-500/20' :
                                    cust.rfm_segment === 'At Risk' ? 'bg-orange-900/30 text-orange-400 border border-orange-500/20' :
                                        'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}>
                                {cust.rfm_segment}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                                <p className="text-[10px] text-slate-500 uppercase mb-1">Total Spent</p>
                                <p className="font-bold text-emerald-400">₹{cust.total_spent.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                                <p className="text-[10px] text-slate-500 uppercase mb-1">Visits</p>
                                <p className="font-bold text-white">{cust.total_visits}</p>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                                <Award size={14} className="text-blue-500" />
                                <span>Avg Bill: ₹{cust.avg_transaction_value.toFixed(0)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <AlertCircle size={14} className="text-orange-500" />
                                <span>Last: {cust.recency_days}d ago</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredData.length === 0 && !loading && (
                <div className="text-center py-20 text-slate-500">
                    <Users size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No customers found matching filters.</p>
                </div>
            )}
        </div>
    );
}
