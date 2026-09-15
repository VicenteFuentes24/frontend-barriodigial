import type { RequestStatus } from '../../types/request';

const labels: Record<RequestStatus, string> = {
  INGRESADO: 'Ingresado',
  ADMITIDO: 'Admitido',
  EN_GESTION: 'En gestión',
  EN_TERRENO: 'En terreno',
  RESUELTO: 'Resuelto',
  RECHAZADO: 'Rechazado',
};

interface StatusBadgeProps {
  status: RequestStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={'status-badge status-' + status.toLowerCase()}>
      {labels[status]}
    </span>
  );
}
