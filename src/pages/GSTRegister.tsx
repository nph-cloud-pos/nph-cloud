import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FileText, Download } from 'lucide-react';

interface GSTBill {
    bill_no: string;
    bill_date: string;
    customer_name: string;
    amount: number;
    tax_amount: number;
    cgst: number;
    sgst: number;
    igst: number;
}

export default function GSTRegister() {
    const [month, setMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
    const [data, setData] = useState<GSTBill[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const startStr = `${month}-01 00:00:00`;
            const endStr = `${month}-31 23:59:59`; // Simple end of month

            const { data: sales, error } = await supabase
                .from('sales')
                .select('bill_no, bill_date, customer_name, amount, taxamount, ctamount, stamount, igstbill')
                .gte('bill_date', startStr)
                .lte('bill_date', endStr)
                .order('bill_date', { ascending: true });

            if (error) throw error;

            if (sales) {
                const mapped = sales.map(s => ({
                    bill_no: s.bill_no,
                    bill_date: s.bill_date,
                    customer_name: s.customer_name || 'Walk-in',
                    amount: Number(s.amount),
                    tax_amount: Number(s.taxamount) || 0,
                    cgst: s.igstbill ? 0 : (Number(s.ctamount) || 0),
                    sgst: s.igstbill ? 0 : (Number(s.stamount) || 0),
                    igst: s.igstbill ? (Number(s.ctamount || 0) + Number(s.stamount || 0)) : 0
                }));
                setData(mapped);
            }
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [month]);

    const totals = data.reduce((acc, curr) => ({
        taxable: acc.taxable + (curr.amount - curr.tax_amount),
        cgst: acc.cgst + curr.cgst,
        sgst: acc.sgst + curr.sgst,
        igst: acc.igst + curr.igst,
        totalTax: acc.totalTax + curr.tax_amount,
        grand: acc.grand + curr.amount
    }), { taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, grand: 0 });

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold mb-2">GST Sales Register</h1>
                    <p className="text-slate-400">Monthly tax compliance and filing report</p>
                </div>
                <div className="flex gap-4">
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 focus:border-blue-500"
                    />
                    <button className="bg-emerald-600 hover:bg-emerald-500 px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition">
                        <Download size={18} /> Export GSTR-1
                    </button>
                </div>
            </div>

            {/* Tax Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase mb-1">Taxable Value</p>
                    <p className="text-2xl font-bold text-white">₹{totals.taxable.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 border-l-4 border-l-blue-500">
                    <p className="text-[10px] text-slate-500 uppercase mb-1">Total CGST + SGST</p>
                    <p className="text-2xl font-bold text-blue-400">₹{(totals.cgst + totals.sgst).toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 border-l-4 border-l-purple-500">
                    <p className="text-[10px] text-slate-500 uppercase mb-1">Total IGST</p>
                    <p className="text-2xl font-bold text-purple-400">₹{totals.igst.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 bg-gradient-to-br from-emerald-500/5 to-transparent">
                    <p className="text-[10px] text-slate-500 uppercase mb-1">Total Tax Collected</p>
                    <p className="text-2xl font-bold text-emerald-400">₹{totals.totalTax.toLocaleString('en-IN')}</p>
                </div>
            </div>

            <div className="bg-slate-900/60 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
                <table className="w-full text-sm">
                    <thead className="bg-slate-800/80 text-slate-400">
                        <tr>
                            <th className="p-4 text-left font-bold">Bill #/Date</th>
                            <th className="p-4 text-left font-bold">Customer</th>
                            <th className="p-4 text-right font-bold">Taxable</th>
                            <th className="p-4 text-right font-bold text-blue-400">CGST</th>
                            <th className="p-4 text-right font-bold text-blue-400">SGST</th>
                            <th className="p-4 text-right font-bold text-purple-400">IGST</th>
                            <th className="p-4 text-right font-bold">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/10">
                        {data.map((bill, i) => (
                            <tr key={i} className="hover:bg-blue-500/5 transition">
                                <td className="p-4">
                                    <div className="font-bold">#{bill.bill_no}</div>
                                    <div className="text-[10px] text-slate-500">{new Date(bill.bill_date).toLocaleDateString()}</div>
                                </td>
                                <td className="p-4 align-top truncate max-w-[150px]">{bill.customer_name}</td>
                                <td className="p-4 text-right">₹{(bill.amount - bill.tax_amount).toFixed(2)}</td>
                                <td className="p-4 text-right text-blue-400/80">₹{bill.cgst.toFixed(2)}</td>
                                <td className="p-4 text-right text-blue-400/80">₹{bill.sgst.toFixed(2)}</td>
                                <td className="p-4 text-right text-purple-400/80">₹{bill.igst.toFixed(2)}</td>
                                <td className="p-4 text-right font-bold text-emerald-400">₹{bill.amount.toLocaleString('en-IN')}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-900 border-t border-slate-700">
                        <tr className="font-extrabold text-white">
                            <td className="p-5" colSpan={2}>TOTAL FOR {month}</td>
                            <td className="p-5 text-right">₹{totals.taxable.toLocaleString('en-IN')}</td>
                            <td className="p-5 text-right text-blue-400">₹{totals.cgst.toLocaleString('en-IN')}</td>
                            <td className="p-5 text-right text-blue-400">₹{totals.sgst.toLocaleString('en-IN')}</td>
                            <td className="p-5 text-right text-purple-400">₹{totals.igst.toLocaleString('en-IN')}</td>
                            <td className="p-5 text-right text-emerald-400">₹{totals.grand.toLocaleString('en-IN')}</td>
                        </tr>
                    </tfoot>
                </table>

                {data.length === 0 && !loading && (
                    <div className="p-20 text-center text-slate-500">
                        <FileText size={48} className="mx-auto mb-4 opacity-10" />
                        <p>No tax records found for the selected month.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
