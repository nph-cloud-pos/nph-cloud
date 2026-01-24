import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ItemProfit from './pages/ItemProfit';

function App() {
    return (
        <BrowserRouter>
            <div className="flex">
                <Sidebar />
                <div className="flex-1 ml-64">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/item-profit" element={<ItemProfit />} />
                    </Routes>
                </div>
            </div>
        </BrowserRouter>
    );
}

export default App;
