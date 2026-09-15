import { useIsAuthenticated } from '@azure/msal-react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import RoleGuard from './auth/RoleGuard';
import AppLayout from './components/layout/AppLayout';
import AuditPage from './pages/AuditPage';
import CatalogPage from './pages/CatalogPage';
import DashboardPage from './pages/DashboardPage';
import ForbiddenPage from './pages/ForbiddenPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import ReportsPage from './pages/ReportsPage';
import RequestDetailPage from './pages/RequestDetailPage';
import RequestsPage from './pages/RequestsPage';

function HomeRedirect() {
  const isAuthenticated = useIsAuthenticated();
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route
            element={
              <RoleGuard allowedRoles={['Admin', 'Operador', 'Cliente']} />
            }
          >
            <Route path="/requests" element={<RequestsPage />} />
            <Route path="/requests/:id" element={<RequestDetailPage />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['Admin', 'Operador']} />}>
            <Route path="/catalog" element={<CatalogPage />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['Admin']} />}>
            <Route path="/reports" element={<ReportsPage />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['Admin', 'Auditor']} />}>
            <Route path="/audit" element={<AuditPage />} />
          </Route>

          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
