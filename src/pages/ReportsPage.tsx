import { RefreshCw } from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import { useReportQuery } from '../hooks/useReportQuery';
import { reportService } from '../services/reportService';
import type { KpiRange, ReportTimeRange } from '../types/report';
import { formatNumber } from '../utils/format';
import { activeRequests, formatReportInstant, formatResolution, hourlySeries, kpiRangeLabels, statusSeries } from '../utils/report';

const loadHours = (signal: AbortSignal) => reportService.getRequestsByHour('last24h', signal);
const loadTop = (signal: AbortSignal) => reportService.getTopProcedures('last7d', signal);

function QueryContent<T>({ query, children }: {
  query: { loading: boolean; error: string | null; data: T | null; retry: () => void };
  children: (data: T) => ReactNode;
}) {
  if (query.loading) return <LoadingState message="Cargando estadísticas..." />;
  if (query.error) return <div role="alert"><ErrorState title="No se pudo cargar esta sección" message={query.error} onRetry={query.retry} /></div>;
  return query.data === null ? null : children(query.data);
}

function ReportWindow({ range }: { range: ReportTimeRange }) {
  return <p className="report-period">Desde {formatReportInstant(range.from)} hasta {formatReportInstant(range.to)}. Hora de Santiago.</p>;
}

export default function ReportsPage() {
  const [range, setRange] = useState<KpiRange>('last24h');
  const [refresh, setRefresh] = useState(0);
  const loadKpis = useCallback((signal: AbortSignal) => reportService.getKpis(range, signal), [range]);
  const kpis = useReportQuery(`${range}:${refresh}`, loadKpis);
  const hours = useReportQuery(`hours:${refresh}`, loadHours);
  const top = useReportQuery(`top:${refresh}`, loadTop);
  const loading = kpis.loading || hours.loading || top.loading;

  return (
    <section className="page-stack">
      <PageHeader title="Reportería" description="Indicadores de gestión de solicitudes municipales."
        actions={<Button onClick={() => setRefresh((value) => value + 1)} disabled={loading} variant="secondary">
          <RefreshCw size={18} aria-hidden="true" />Actualizar
        </Button>} />
      <div className="report-filter">
        <label htmlFor="report-range">Período de indicadores</label>
        <select id="report-range" value={range} onChange={(event) => setRange(event.target.value as KpiRange)}>
          <option value="last24h">Últimas 24 horas</option><option value="last7d">Últimos 7 días</option>
        </select>
      </div>
      <section className="page-stack" aria-labelledby="report-kpis" aria-busy={kpis.loading}>
        <div>
          <h2 id="report-kpis">Indicadores · {kpiRangeLabels[range]}</h2>
          <p className="report-period">Solicitudes creadas en el período, según su estado actual. El tiempo promedio corresponde a las resueltas de ese conjunto.</p>
        </div>
        <QueryContent query={kpis}>{(data) => <>
          <ReportWindow range={data.range} />
          <div className="metric-grid">
            <article className="metric-card" aria-label="Total de trámites">
              <span>Total de trámites</span><strong>{formatNumber(data.totalRequests)}</strong><p>{kpiRangeLabels[range]}</p>
            </article>
            <article className="metric-card" aria-label="Trámites activos">
              <span>Trámites activos</span><strong>{formatNumber(activeRequests(data))}</strong><p>{kpiRangeLabels[range]}</p>
            </article>
            <article className="metric-card" aria-label="Trámites resueltos">
              <span>Trámites resueltos</span><strong>{formatNumber(data.resolvedRequests)}</strong><p>{kpiRangeLabels[range]}</p>
            </article>
            <article className="metric-card" aria-label="Tiempo de resolución">
              <span>Tiempo de resolución</span><strong className={data.averageResolutionSeconds === null ? 'report-resolution-empty' : undefined}>{formatResolution(data.averageResolutionSeconds)}</strong><p>{kpiRangeLabels[range]}</p>
            </article>
          </div>
        </>}</QueryContent>
      </section>
      <div className="report-grid">
        <section className="detail-panel" aria-labelledby="report-hours" aria-busy={hours.loading}>
          <h2 id="report-hours">Trámites por hora</h2>
          <p className="report-period">Últimas 24 horas · Hora de Santiago. Solo se muestran las horas informadas por el servicio.</p>
          <QueryContent query={hours}>{(data) => <>
            <ReportWindow range={data.range} />
            {data.hours.length === 0 ? <EmptyState title="Sin solicitudes creadas en las últimas 24 horas." /> :
              <ul className="compact-list report-hours">
                {hourlySeries(data).map((item) => <li key={item.hour}>
                  <time dateTime={item.hour}>{formatReportInstant(item.hour)}</time>
                  <strong aria-label={`${item.totalRequests} solicitudes`}>{formatNumber(item.totalRequests)}</strong>
                </li>)}
              </ul>}
          </>}</QueryContent>
        </section>
        <section className="detail-panel" aria-labelledby="report-statuses" aria-busy={kpis.loading}>
          <h2 id="report-statuses">Estados de los trámites</h2>
          <p className="report-period">{kpiRangeLabels[range]} · Los cuatro primeros estados corresponden a trámites activos.</p>
          <QueryContent query={kpis}>{(data) => data.totalRequests === 0 ? <EmptyState title="Sin solicitudes creadas en este período." /> :
            <ul className="compact-list report-statuses">
              {statusSeries(data).map((item) => <li key={item.status}>
                <div className="report-status-label"><StatusBadge status={item.status} /><strong>{formatNumber(item.count)}</strong></div>
                <div className="report-bar-track" aria-hidden="true"><span className={item.active ? 'report-bar-active' : 'report-bar-final'} style={{ width: `${item.count / Math.max(data.totalRequests, 1) * 100}%` }} /></div>
              </li>)}
            </ul>}
          </QueryContent>
        </section>
        <section className="detail-panel detail-panel-wide" aria-labelledby="report-top" aria-busy={top.loading}>
          <h2 id="report-top">Trámites más demandados</h2>
          <p className="report-period">Últimos 7 días</p>
          <QueryContent query={top}>{(data) => <>
            <ReportWindow range={data.range} />
            {data.procedures.length === 0 ? <EmptyState title="Sin solicitudes para mostrar en los últimos siete días." /> :
              <ul className="compact-list">
                {data.procedures.map((procedure) => <li key={procedure.procedureId}>
                  <span>{procedure.procedureName}</span><strong aria-label={`${procedure.totalRequests} solicitudes`}>{formatNumber(procedure.totalRequests)}</strong>
                </li>)}
              </ul>}
          </>}</QueryContent>
        </section>
      </div>
    </section>
  );
}
