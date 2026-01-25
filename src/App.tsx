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

function App() {
    return (
        <BrowserRouter>
            <div className="flex bg-slate-950 min-h-screen">
                <Sidebar />
                <div className="flex-1 ml-64 overflow-x-hidden">
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
