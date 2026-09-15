import { FileQuestion } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="center-page">
      <FileQuestion size={46} aria-hidden="true" />
      <h1>404</h1>
      <p>La página solicitada no existe.</p>
      <Link className="button button-secondary" to="/dashboard">
        Volver al dashboard
      </Link>
    </section>
  );
}
