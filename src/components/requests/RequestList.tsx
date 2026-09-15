import { Link } from 'react-router-dom';
import type { ProcedureType } from '../../types/catalog';
import type { ServiceRequest } from '../../types/request';
import { formatDate, formatText } from '../../utils/format';
import { resolveProcedureName } from '../../utils/procedures';
import EmptyState from '../ui/EmptyState';
import StatusBadge from '../ui/StatusBadge';

interface RequestListProps {
  procedureTypes: ProcedureType[];
  requests: ServiceRequest[];
}

export default function RequestList({
  procedureTypes,
  requests,
}: RequestListProps) {
  if (requests.length === 0) {
    return (
      <EmptyState
        title="No hay trámites disponibles."
        description="Cuando el servicio entregue datos, aparecerán en este listado."
      />
    );
  }

  return (
    <div className="table-card">
      <table className="data-table">
        <thead>
          <tr>
            <th>Trámite</th>
            <th>Estado</th>
            <th>Ingreso</th>
            <th>Creado por</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td>
                <strong>
                  {formatText(
                    resolveProcedureName(request.procedureTypeId, procedureTypes),
                  )}
                </strong>
                <span>ID {request.id}</span>
              </td>
              <td>
                <StatusBadge status={request.status} />
              </td>
              <td>{formatDate(request.createdAt)}</td>
              <td>{formatText(request.createdBy)}</td>
              <td>
                <Link className="text-link" to={'/requests/' + request.id}>
                  Ver detalle
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
