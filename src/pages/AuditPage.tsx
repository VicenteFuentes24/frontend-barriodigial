import { Search } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import { auditService } from '../services/auditService';
import { getApiErrorMessage } from '../services/apiClient';
import type { AuditEvent, AuditFilters } from '../types/audit';
import { formatDate, formatText } from '../utils/format';

export default function AuditPage() {
  const [filters, setFilters] = useState<AuditFilters>({});
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAudit = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      setEvents(await auditService.getAuditEvents(filters));
    } catch (loadError) {
      setEvents([]);
      setError(
        getApiErrorMessage(
          loadError,
          'No fue posible cargar la auditoría.',
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  const submitFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadAudit();
  };

  return (
    <section className="page-stack">
      <PageHeader
        title="Auditoría"
        description="Consulta de trazabilidad en modo solo lectura desde /api/audit."
      />

      <form className="filter-bar" onSubmit={submitFilters}>
        <label>
          <span>Usuario</span>
          <input
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                user: event.target.value,
              }))
            }
            placeholder="correo o nombre"
            value={filters.user ?? ''}
          />
        </label>
        <label>
          <span>Fecha</span>
          <input
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                date: event.target.value,
              }))
            }
            type="date"
            value={filters.date ?? ''}
          />
        </label>
        <label>
          <span>Tipo de evento</span>
          <input
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                eventType: event.target.value,
              }))
            }
            placeholder="ej. REQUEST_STATUS_CHANGED"
            value={filters.eventType ?? ''}
          />
        </label>
        <Button type="submit">
          <Search size={18} aria-hidden="true" />
          Buscar
        </Button>
      </form>

      {isLoading ? <LoadingState message="Cargando auditoría..." /> : null}
      {!isLoading && error ? <ErrorState message={error} onRetry={loadAudit} /> : null}
      {!isLoading && !error && events.length === 0 ? (
        <EmptyState title="No hay eventos de auditoría disponibles." />
      ) : null}
      {!isLoading && !error && events.length > 0 ? (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Evento</th>
                <th>Entidad</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>{formatDate(event.occurredAt)}</td>
                  <td>{formatText(event.user)}</td>
                  <td>{formatText(event.eventType)}</td>
                  <td>
                    <strong>{formatText(event.entityType)}</strong>
                    <span>{formatText(event.entityId)}</span>
                  </td>
                  <td>{formatText(event.detail)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
