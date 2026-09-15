import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import { getApiErrorMessage } from '../services/apiClient';
import { reportService } from '../services/reportService';
import type { ReportKpis, TopProcedure } from '../types/report';
import { formatNumber } from '../utils/format';

export default function ReportsPage() {
  const [kpis, setKpis] = useState<ReportKpis | null>(null);
  const [topProcedures, setTopProcedures] = useState<TopProcedure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const [kpiResponse, topResponse] = await Promise.all([
        reportService.getKpis('last24h'),
        reportService.getTopProcedures('last7d'),
      ]);
      setKpis(kpiResponse);
      setTopProcedures(topResponse);
    } catch (loadError) {
      setKpis(null);
      setTopProcedures([]);
      setError(
        getApiErrorMessage(
          loadError,
          'Los datos de reportería estarán disponibles cuando el servicio esté conectado.',
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  return (
    <section className="page-stack">
      <PageHeader
        title="Reportería"
        description="Panel preparado para KPIs y rankings reales del backend."
        actions={
          <Button onClick={loadReports} variant="secondary">
            <RefreshCw size={18} aria-hidden="true" />
            Actualizar
          </Button>
        }
      />

      {isLoading ? <LoadingState message="Cargando reportería..." /> : null}
      {!isLoading && error ? (
        <ErrorState
          message="Los datos de reportería estarán disponibles cuando el servicio esté conectado."
          onRetry={loadReports}
          title={error}
        />
      ) : null}

      {!isLoading && !error ? (
        <>
          <div className="metric-grid">
            <article className="metric-card">
              <span>Trámites activos</span>
              <strong>{formatNumber(kpis?.activeRequests)}</strong>
              <p>GET /api/report/kpis?range=last24h</p>
            </article>
            <article className="metric-card">
              <span>Trámites resueltos</span>
              <strong>{formatNumber(kpis?.resolvedRequests)}</strong>
              <p>GET /api/report/kpis?range=last24h</p>
            </article>
            <article className="metric-card">
              <span>Tiempo de resolución</span>
              <strong>{kpis?.averageResolutionTime ?? '---'}</strong>
              <p>Sin datos inventados.</p>
            </article>
          </div>

          <div className="report-grid">
            <section className="detail-panel">
              <h2>Trámites por hora</h2>
              {kpis?.hourlyRequests && kpis.hourlyRequests.length > 0 ? (
                <ul className="compact-list">
                  {kpis.hourlyRequests.map((item) => (
                    <li key={item.label}>
                      <span>{item.label}</span>
                      <strong>{formatNumber(item.value)}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="Sin información disponible." />
              )}
            </section>

            <section className="detail-panel">
              <h2>Estados activos</h2>
              {kpis?.activeStatuses && kpis.activeStatuses.length > 0 ? (
                <ul className="compact-list">
                  {kpis.activeStatuses.map((item) => (
                    <li key={item.label}>
                      <span>{item.label}</span>
                      <strong>{formatNumber(item.value)}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="Sin información disponible." />
              )}
            </section>

            <section className="detail-panel detail-panel-wide">
              <h2>Trámites más demandados</h2>
              {topProcedures.length > 0 ? (
                <ul className="compact-list">
                  {topProcedures.map((procedure) => (
                    <li key={procedure.procedureId ?? procedure.procedureName}>
                      <span>{procedure.procedureName}</span>
                      <strong>{formatNumber(procedure.total)}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="Sin información disponible." />
              )}
            </section>
          </div>
        </>
      ) : null}
    </section>
  );
}
