import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import SellerSetup from './pages/SellerSetup';
import Transactions from './pages/Transactions';
import Cart from './pages/Cart';
import DashboardSeller from './pages/DashboardSeller';
import ProductList from './pages/ProductList';
import TokoSetting from './pages/TokoSetting';
import Users from './pages/admin/Users';
import Products from './pages/admin/Products';

const App = () => {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route element={<MainLayout />}>
                        <Route index element={<Home />} />
                        <Route element={<ProtectedRoute />}>
                            <Route path="transactions" element={<Transactions />} />
                            <Route path="cart" element={<Cart />} />
                            <Route path="shop/new" element={<SellerSetup />} />
                            <Route path="shop" element={<TokoSetting />} />
                            <Route path="shop/dashboard" element={<DashboardSeller />} />
                            <Route path="products" element={<ProductList />} />
                        </Route>
                    </Route>
                    <Route element={<ProtectedRoute />}>
                        <Route element={<RoleGuard roles={['admin']} />}>
                            <Route path="admin" element={<AdminLayout />}>
                                <Route index element={<Navigate to="users" replace />} />
                                <Route path="users" element={<Users />} />
                                <Route path="products" element={<Products />} />
                            </Route>
                        </Route>
                    </Route>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
};

export default App;
