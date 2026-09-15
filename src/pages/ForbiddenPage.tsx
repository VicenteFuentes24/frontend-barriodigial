import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ForbiddenPage() {
  return (
    <section className="center-page">
      <ShieldAlert size={46} aria-hidden="true" />
      <h1>403</h1>
      <p>No tienes permisos para acceder a esta sección.</p>
      <Link className="button button-secondary" to="/dashboard">
        Volver al dashboard
      </Link>
    </section>
  );
}
