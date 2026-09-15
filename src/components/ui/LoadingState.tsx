interface LoadingStateProps {
  message?: string;
  fullPage?: boolean;
}

export default function LoadingState({
  message = 'Cargando información...',
  fullPage = false,
}: LoadingStateProps) {
  return (
    <div className={fullPage ? 'state-page' : 'state-box'} role="status">
      <span className="spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
