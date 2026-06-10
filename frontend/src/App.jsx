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
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SellerSetup from './pages/SellerSetup';
import Transactions from './pages/Transactions';
import Cart from './pages/Cart';
import DashboardBuyer from './pages/DashboardBuyer';
import DashboardSeller from './pages/DashboardSeller';
import ProductList from './pages/ProductList';
import TokoSetting from './pages/TokoSetting';
import AdminPage from './pages/AdminPage';
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

import Checkout from './pages/Checkout';
import NotFound from './pages/NotFound';
import SellerProfile from './pages/SellerProfile';

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
                            <Route path="products/:id" element={<ProductDetail />} />
                            <Route path="sellers/:sellerId" element={<SellerProfile />} />

                            <Route element={<ProtectedRoute />}>
                                <Route path="transactions" element={<Transactions />} />
                                <Route path="cart" element={<Cart />} />
                                <Route path="checkout" element={<Checkout />} />
                                <Route path="notifications" element={<Notifications />} />
                                <Route path="negotiations" element={<Negotiations />} />
                                <Route path="negotiations/:id" element={<NegotiationDetail />} />
                                <Route path="shop/new" element={<SellerSetup />} />
                                <Route path="contracts/new" element={<ContractNew />} />
                                <Route path="contracts/:id" element={<ContractDetail />} />

                                <Route element={<RoleGuard roles={['buyer', 'seller']} />}>
                                    <Route path="dashboard" element={<DashboardBuyer />} />
                                </Route>

                                <Route element={<RoleGuard roles={['seller']} />}>
                                    <Route path="shop" element={<TokoSetting />} />
                                    <Route path="shop/dashboard" element={<DashboardSeller />} />
                                    <Route path="products" element={<Navigate to="/shop/products" replace />} />
                                    <Route path="shop/products" element={<ProductList />} />
                                    <Route path="shop/products/create" element={<ProductList />} />
                                    <Route path="shop/products/:id/edit" element={<ProductList />} />
                                </Route>
                            </Route>
                        </Route>

                        <Route element={<ProtectedRoute />}>
                            <Route element={<RoleGuard roles={['admin', 'super_admin', 'superadmin']} />}>
                                <Route path="admin" element={<AdminLayout />}>
                                    <Route index element={<AdminPage />} />
                                    <Route path="dashboard" element={<Navigate to="/admin" replace />} />
                                    <Route path="users" element={<Users />} />
                                    <Route path="products" element={<Products />} />
                                    <Route path="audit" element={<AuditLogs />} />
                                </Route>
                            </Route>
                        </Route>

                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </BrowserRouter>
            </NotificationProvider>
        </AuthProvider>
    );
};

export default App;
