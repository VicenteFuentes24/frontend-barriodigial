import { render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import App from '../src/App';
import Sidebar from '../src/components/layout/Sidebar';
import type { AppRole } from '../src/types/auth';

const auth = vi.hoisted(() => ({ signedIn: true, roles: ['Admin'] as AppRole[], account: { username: 'test@example.invalid' } }));
vi.mock('@azure/msal-react', () => ({
  useIsAuthenticated: () => auth.signedIn,
  useMsal: () => ({ accounts: auth.signedIn ? [auth.account] : [], inProgress: 'none', instance: { getActiveAccount: () => auth.signedIn ? auth.account : null, setActiveAccount: vi.fn(), logoutRedirect: vi.fn() } }),
}));
vi.mock('../src/hooks/useAuthProfile', () => ({ useAuthProfile: () => ({
  account: auth.signedIn ? auth.account : null, error: '', isLoading: false, roles: auth.roles, refreshProfile: vi.fn(),
  profile: { name: 'Usuario de prueba', initials: 'UP', primaryRole: auth.roles[0] },
}) }));
vi.mock('../src/auth/authConfig', () => ({ azureConfig: { redirectUri: 'http://localhost:5173' } }));
vi.mock('../src/components/layout/AppLayout', () => ({ default: () => <Outlet /> }));
vi.mock('../src/pages/ReportsPage', () => ({ default: () => <h1>Report page</h1> }));
vi.mock('../src/pages/RequestsPage', () => ({ default: () => <h1>Requests page</h1> }));
vi.mock('../src/pages/RequestDetailPage', () => ({ default: () => <h1>Request detail page</h1> }));
vi.mock('../src/pages/CatalogPage', () => ({ default: () => <h1>Catalog page</h1> }));
vi.mock('../src/pages/AuditPage', () => ({ default: () => <h1>Audit page</h1> }));
vi.mock('../src/pages/DashboardPage', () => ({ default: () => <h1>Dashboard page</h1> }));
vi.mock('../src/pages/ForbiddenPage', () => ({ default: () => <h1>Forbidden page</h1> }));
vi.mock('../src/pages/LoginPage', () => ({ default: () => <h1>Login page</h1> }));

beforeEach(() => { auth.signedIn = true; auth.roles = ['Admin']; });

it.each([
  ['Admin', '/reports', 'Report'], ['Operador', '/reports', 'Forbidden'],
  ['Cliente', '/reports', 'Forbidden'], ['Auditor', '/reports', 'Forbidden'],
  ['Admin', '/requests', 'Requests'], ['Operador', '/requests', 'Requests'], ['Cliente', '/requests', 'Requests'],
  ['Admin', '/catalog', 'Catalog'], ['Operador', '/catalog', 'Catalog'], ['Cliente', '/catalog', 'Forbidden'],
  ['Admin', '/audit', 'Audit'], ['Auditor', '/audit', 'Audit'], ['Cliente', '/audit', 'Forbidden'],
  ['Cliente', '/dashboard', 'Dashboard'], ['Admin', '/requests/1', 'Request detail'],
])('preserves %s access to %s', (role, path, page) => {
  auth.roles = [role as AppRole];
  render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: `${page} page` })).toBeVisible();
});

it('redirects an unauthenticated report visit to login', () => {
  auth.signedIn = false;
  render(<MemoryRouter initialEntries={['/reports']}><App /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: 'Login page' })).toBeVisible();
});

it.each(['Admin', 'Operador', 'Cliente', 'Auditor'] as AppRole[])('only exposes Report navigation for Admin (%s)', (role) => {
  auth.roles = [role];
  render(<MemoryRouter><Sidebar isOpen={false} onClose={vi.fn()} /></MemoryRouter>);
  if (role === 'Admin') expect(screen.getByRole('link', { name: 'Reportería' })).toHaveAttribute('href', '/reports');
  else expect(screen.queryByRole('link', { name: 'Reportería' })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
});
