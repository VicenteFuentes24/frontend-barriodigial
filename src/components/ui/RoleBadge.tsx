import type { AppRole } from '../../types/auth';

interface RoleBadgeProps {
  label?: string;
  role?: AppRole;
}

export default function RoleBadge({ label, role }: RoleBadgeProps) {
  return <span className="role-badge">{label ?? role ?? 'Sin rol'}</span>;
}
