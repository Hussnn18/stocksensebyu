import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './App.jsx';
import { AppLayout } from './components/app/AppLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import MoveHistoryPage from './pages/moves/MoveHistoryPage';
import OperationsListPage from './pages/operations/OperationsListPage';
import NotFoundPage from './pages/NotFoundPage';
import CategoriesPage from './pages/products/CategoriesPage';
import ProductDetailPage from './pages/products/ProductDetailPage';
import ProductsPage from './pages/products/ProductsPage';
import ReorderRulesPage from './pages/products/ReorderRulesPage';
import ProfilePage from './pages/settings/ProfilePage';
import WarehousesPage from './pages/settings/WarehousesPage';

// "/" is the public landing page (with the sign-in modal). Everything under AppLayout needs a login.
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/categories" element={<CategoriesPage />} />
        <Route path="/products/reorder-rules" element={<ReorderRulesPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/operations/receipts" element={<OperationsListPage key="receipt" type="receipt" />} />
        <Route path="/operations/deliveries" element={<OperationsListPage key="delivery" type="delivery" />} />
        <Route path="/operations/transfers" element={<OperationsListPage key="internal" type="internal" />} />
        <Route path="/operations/adjustments" element={<OperationsListPage key="adjustment" type="adjustment" />} />
        <Route path="/moves" element={<MoveHistoryPage />} />
        <Route path="/settings/warehouses" element={<WarehousesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
