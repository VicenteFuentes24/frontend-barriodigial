import { useMsal } from '@azure/msal-react';
import {
  BarChart3,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  SearchCheck,
  Settings2,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { azureConfig } from '../../auth/authConfig';
import { hasAnyRole } from '../../auth/authUtils';
import { useAuthProfile } from '../../hooks/useAuthProfile';
import type { AppRole } from '../../types/auth';
import Button from '../ui/Button';
import RoleBadge from '../ui/RoleBadge';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles?: AppRole[];
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  {
    to: '/requests',
    label: 'Trámites',
    icon: ClipboardList,
    roles: ['Admin', 'Operador', 'Cliente'],
  },
  {
    to: '/catalog',
    label: 'Catálogo',
    icon: Settings2,
    roles: ['Admin', 'Operador'],
  },
  {
    to: '/reports',
    label: 'Reportería',
    icon: BarChart3,
    roles: ['Admin'],
  },
  {
    to: '/audit',
    label: 'Auditoría',
    icon: SearchCheck,
    roles: ['Admin', 'Auditor'],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { instance } = useMsal();
  const { account, error, isLoading, profile, roles } = useAuthProfile();
  const visibleItems = navItems.filter((item) =>
    item.roles ? hasAnyRole(roles, item.roles) : true,
  );

  const logout = () => {
    void instance.logoutRedirect({
      account: account ?? undefined,
      postLogoutRedirectUri: azureConfig.redirectUri,
    });
  };

  return (
    <>
      <aside className={isOpen ? 'sidebar sidebar-open' : 'sidebar'}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <UsersRound size={24} />
          </div>
          <div>
            <strong>BarrioDigital</strong>
            <span>Atención vecinal</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Navegación principal">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                className={({ isActive }) =>
                  isActive ? 'nav-link nav-link-active' : 'nav-link'
                }
                key={item.to}
                onClick={onClose}
                to={item.to}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-user">
          <div className="avatar" aria-hidden="true">
            {profile?.initials ?? 'BD'}
          </div>
          <div className="user-copy">
            <strong>
              {profile?.name ?? (isLoading ? 'Cargando perfil...' : 'Usuario')}
            </strong>
            <span>{profile?.email ?? account?.username ?? 'correo no disponible'}</span>
            {isLoading ? (
              <RoleBadge label="Cargando..." />
            ) : (
              <RoleBadge role={profile?.primaryRole} />
            )}
            {error ? <span className="sidebar-error">{error}</span> : null}
          </div>
          <Button className="logout-button" onClick={logout} variant="ghost">
            <LogOut size={18} aria-hidden="true" />
            Cerrar sesión
          </Button>
        </div>

        <div className="sidebar-footer">
          <FileText size={16} aria-hidden="true" />
          <span>Sin secretos ni tokens visibles</span>
        </div>
      </aside>

      {isOpen ? (
        <button
          aria-label="Cerrar menú"
          className="sidebar-overlay"
          onClick={onClose}
          type="button"
        />
      ) : null}
    </>
  );
}
