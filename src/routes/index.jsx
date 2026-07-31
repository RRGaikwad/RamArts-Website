import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PublicLayout } from '../components/PublicLayout';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';

const HomePage = lazy(() => import('../features/home/HomePage'));
const AboutPage = lazy(() => import('../features/home/AboutPage'));
const NotFoundPage = lazy(() => import('../features/home/NotFoundPage'));
const ContactPage = lazy(() => import('../features/inquiries/ContactPage'));
const ProductsPage = lazy(() => import('../features/products/ProductsPage'));
const ProductDetailPage = lazy(() => import('../features/products/ProductDetailPage'));
const UpdatesPage = lazy(() => import('../features/updates/UpdatesPage'));
const UpdateDetailPage = lazy(() => import('../features/updates/UpdateDetailPage'));

const LoginPage = lazy(() => import('../features/auth/LoginPage'));
const AdminLayout = lazy(() => import('../features/auth/AdminLayout'));
const DashboardPage = lazy(() => import('../features/auth/DashboardPage'));
const AdminProductsPage = lazy(() => import('../features/products/AdminProductsPage'));
const AdminProductFormPage = lazy(() => import('../features/products/AdminProductFormPage'));
const AdminCategoriesPage = lazy(() => import('../features/categories/AdminCategoriesPage'));
const AdminUpdatesPage = lazy(() => import('../features/updates/AdminUpdatesPage'));
const AdminUpdateFormPage = lazy(() => import('../features/updates/AdminUpdateFormPage'));
const AdminInquiriesPage = lazy(() => import('../features/inquiries/AdminInquiriesPage'));
const AdminSettingsPage = lazy(() => import('../features/settings/AdminSettingsPage'));

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading page">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-r-transparent" />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:slug" element={<ProductDetailPage />} />
          <Route path="updates" element={<UpdatesPage />} />
          <Route path="updates/:slug" element={<UpdateDetailPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="/admin/login" element={<LoginPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/:id" element={<AdminProductFormPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="updates" element={<AdminUpdatesPage />} />
          <Route path="updates/:id" element={<AdminUpdateFormPage />} />
          <Route path="inquiries" element={<AdminInquiriesPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
