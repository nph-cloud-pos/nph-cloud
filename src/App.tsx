import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ItemProfit from './pages/ItemProfit';
import DailySales from './pages/DailySales';
import PaymentAnalysis from './pages/PaymentAnalysis';
import StockSummary from './pages/StockSummary';
import CustomerRFM from './pages/CustomerRFM';
import DeadStock from './pages/DeadStock';
import CategoryProfit from './pages/CategoryProfit';
import GSTRegister from './pages/GSTRegister';
import { useState } from 'react';
import { Menu } from 'lucide-react';

function App() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <BrowserRouter>
            <div className="flex bg-slate-950 min-h-screen">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <div className="flex-1 w-full overflow-x-hidden">
                    {/* Mobile Header */}
                    <div className="md:hidden p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 sticky top-0 z-30">
                        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Posjet Live
                        </h1>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 hover:bg-slate-800 rounded-lg transition"
                        >
                            <Menu size={24} className="text-slate-400" />
                        </button>
                    </div>

                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/daily-sales" element={<DailySales />} />
                        <Route path="/payments" element={<PaymentAnalysis />} />
                        <Route path="/item-profit" element={<ItemProfit />} />
                        <Route path="/stock" element={<StockSummary />} />
                        <Route path="/customers" element={<CustomerRFM />} />
                        <Route path="/dead-stock" element={<DeadStock />} />
                        <Route path="/category-profit" element={<CategoryProfit />} />
                        <Route path="/gst" element={<GSTRegister />} />
                    </Routes>
                </div>
            </div>
        </BrowserRouter>
    );
}

export default App;
