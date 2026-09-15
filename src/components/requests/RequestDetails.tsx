import type { RequestDetail } from '../../types/request';
import { formatDate, formatText } from '../../utils/format';
import StatusBadge from '../ui/StatusBadge';

interface RequestDetailsProps {
  procedureName?: string;
  request: RequestDetail;
}

export default function RequestDetails({
  procedureName,
  request,
}: RequestDetailsProps) {
  const typeLabel =
    procedureName ??
    request.procedureName ??
    (request.procedureTypeId ? 'Tipo #' + request.procedureTypeId : undefined);
  const hasStatusHistory = Boolean(
    request.statusHistory && request.statusHistory.length > 0,
  );

  return (
    <section className="detail-layout">
      <div className="detail-panel">
        <h2>Información del trámite</h2>
        <dl className="detail-list">
          <div>
            <dt>ID</dt>
            <dd>{request.id}</dd>
          </div>
          <div>
            <dt>Tipo</dt>
            <dd>{formatText(typeLabel)}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>
              <StatusBadge status={request.status} />
            </dd>
          </div>
          <div>
            <dt>Ingreso</dt>
            <dd>{formatDate(request.createdAt)}</dd>
          </div>
          <div>
            <dt>Última actualización</dt>
            <dd>{formatDate(request.updatedAt)}</dd>
          </div>
          <div>
            <dt>Creado por</dt>
            <dd>{formatText(request.createdBy)}</dd>
          </div>
        </dl>
      </div>

      <div className="detail-panel">
        <h2>Descripción</h2>
        <p>{formatText(request.description)}</p>
      </div>

      {hasStatusHistory ? (
        <div className="detail-panel detail-panel-wide">
          <h2>Trazabilidad</h2>
          <ol className="timeline">
            {request.statusHistory?.map((item) => (
              <li key={(item.changedAt ?? '') + item.status}>
                <StatusBadge status={item.status} />
                <span>{formatDate(item.changedAt)}</span>
                <p>{formatText(item.changedBy)}</p>
                {item.comment ? <small>{item.comment}</small> : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
