import { AlertTriangle } from 'lucide-react';
import Button from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = 'No se pudo cargar la información',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="state-box state-error">
      <AlertTriangle className="state-icon" aria-hidden="true" />
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Reintentar
        </Button>
      ) : null}
    </div>
  );
}
