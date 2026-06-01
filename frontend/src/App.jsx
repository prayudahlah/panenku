import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
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
import AuditLogs from './pages/admin/AuditLogs';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Notifications from './pages/Notifications';
import Negotiations from './pages/Negotiations';
import NegotiationDetail from './pages/NegotiationDetail';
import ContractNew from './pages/ContractNew';
import ContractDetail from './pages/ContractDetail';

const App = () => {
    return (
        <AuthProvider>
            <NotificationProvider>
            <BrowserRouter>
                <Routes>
                    <Route element={<MainLayout />}>
                        <Route index element={<Home />} />
                        <Route path="catalog" element={<Catalog />} />
                        <Route path="product/:id" element={<ProductDetail />} />
                        <Route element={<ProtectedRoute />}>
                            <Route path="transactions" element={<Transactions />} />
                            <Route path="cart" element={<Cart />} />
                            <Route path="notifications" element={<Notifications />} />
                            <Route path="negotiations" element={<Negotiations />} />
                            <Route path="negotiations/:id" element={<NegotiationDetail />} />
                            <Route path="shop/new" element={<SellerSetup />} />
                            <Route path="shop" element={<TokoSetting />} />
                            <Route path="shop/dashboard" element={<DashboardSeller />} />
                            <Route path="products" element={<ProductList />} />
                            <Route path="contracts/new" element={<ContractNew />} />
                            <Route path="contracts/:id" element={<ContractDetail />} />
                        </Route>
                    </Route>
                    <Route element={<ProtectedRoute />}>
                        <Route element={<RoleGuard roles={['admin']} />}>
                            <Route path="admin" element={<AdminLayout />}>
                                <Route index element={<Navigate to="users" replace />} />
                                <Route path="users" element={<Users />} />
                                <Route path="products" element={<Products />} />
                                <Route path="audit" element={<AuditLogs />} />
                            </Route>
                        </Route>
                    </Route>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                </Routes>
            </BrowserRouter>
            </NotificationProvider>
        </AuthProvider>
    );
};

export default App;
