import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/shared/ProtectedRoute';
import PageTransition from './components/shared/PageTransition';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import OrderSuccess from './pages/OrderSuccess';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60000,
    },
  },
});

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
        <Route path="/products" element={<PageTransition><Products /></PageTransition>} />
        <Route path="/products/:slug" element={<PageTransition><ProductDetail /></PageTransition>} />

        {/* Protected Routes */}
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <PageTransition>
                <Cart />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <PageTransition>
                <Orders />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <PageTransition>
                <OrderDetail />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id/success"
          element={
            <ProtectedRoute>
              <PageTransition>
                <OrderSuccess />
              </PageTransition>
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Header />
        <main style={{ flex: 1 }}>
          <AnimatedRoutes />
        </main>
        <Footer />

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '0.625rem',
              fontSize: '0.8125rem',
              padding: '12px 16px',
              boxShadow: 'var(--shadow-md)',
            },
            success: {
              iconTheme: {
                primary: 'var(--success)',
                secondary: 'var(--bg-elevated)',
              },
            },
            error: {
              iconTheme: {
                primary: 'var(--danger)',
                secondary: 'var(--bg-elevated)',
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
