import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Landing, Login } from './pages';
import { ProtectedRoute, ErrorBoundary, LoadingSpinner } from './components';
import { useAuthStore } from './store/authStore';

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Organizations = lazy(() => import('./pages/admin/Organizations').then(m => ({ default: m.Organizations })));
const KnowledgeBase = lazy(() => import('./pages/admin/KnowledgeBase').then(m => ({ default: m.KnowledgeBase })));
const GlobalEscalations = lazy(() => import('./pages/admin/GlobalEscalations').then(m => ({ default: m.GlobalEscalations })));
const LabTests = lazy(() => import('./pages/admin/LabTests').then(m => ({ default: m.LabTests })));
const PortalDashboard = lazy(() => import('./pages').then(m => ({ default: m.PortalDashboard })));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#fff',
              border: '1px solid #334155',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
              style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #10b981',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
              style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #ef4444',
              },
            },
            loading: {
              iconTheme: {
                primary: '#3b82f6',
                secondary: '#fff',
              },
            },
          }}
        />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-900"><LoadingSpinner size="lg" /></div>}>
                <AdminLayout>
                  <Suspense fallback={<div className="flex items-center justify-center p-8"><LoadingSpinner /></div>}>
                    <Routes>
                      <Route path="/" element={<AdminDashboard />} />
                      <Route path="/organizations" element={<Organizations />} />
                      <Route path="/knowledge" element={<KnowledgeBase />} />
                      <Route path="/escalations" element={<GlobalEscalations />} />
                      <Route path="/lab-tests" element={<LabTests />} />
                    </Routes>
                  </Suspense>
                </AdminLayout>
              </Suspense>
            </ProtectedRoute>
          }
        />

        <Route
          path="/portal/*"
          element={
            <ProtectedRoute allowedRoles={['clinic_admin', 'doctor', 'staff']}>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950"><LoadingSpinner size="lg" /></div>}>
                <PortalDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />
      </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
