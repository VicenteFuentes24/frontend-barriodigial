import { Menu } from 'lucide-react';
import { useAuthProfile } from '../../hooks/useAuthProfile';
import Button from '../ui/Button';
import RoleBadge from '../ui/RoleBadge';

interface HeaderProps {
  onOpenMenu: () => void;
}

export default function Header({ onOpenMenu }: HeaderProps) {
  const { isLoading, profile } = useAuthProfile();

  return (
    <header className="app-header">
      <Button
        aria-label="Abrir menú"
        className="icon-button mobile-menu-button"
        onClick={onOpenMenu}
        variant="ghost"
      >
        <Menu size={20} aria-hidden="true" />
      </Button>

      <div>
        <p className="eyebrow">Plataforma municipal</p>
        <h2>BarrioDigital</h2>
      </div>

      <div className="header-user">
        {isLoading ? (
          <RoleBadge label="Cargando..." />
        ) : (
          <RoleBadge role={profile?.primaryRole} />
        )}
        <div className="avatar" aria-hidden="true">
          {profile?.initials ?? 'BD'}
        </div>
      </div>
    </header>
  );
}
