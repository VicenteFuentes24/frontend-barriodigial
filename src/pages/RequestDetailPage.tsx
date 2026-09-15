import { ArrowLeft, Save } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { hasAnyRole } from '../auth/authUtils';
import RequestDetails from '../components/requests/RequestDetails';
import Button from '../components/ui/Button';
import ErrorState from '../components/ui/ErrorState';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import { useAuthProfile } from '../hooks/useAuthProfile';
import { getApiErrorMessage } from '../services/apiClient';
import { catalogService } from '../services/catalogService';
import { requestsService } from '../services/requestsService';
import type { ProcedureType } from '../types/catalog';
import {
  requestStatuses,
  type RequestDetail,
  type RequestStatus,
} from '../types/request';
import { resolveProcedureName } from '../utils/procedures';

export default function RequestDetailPage() {
  const { id } = useParams();
  const { roles } = useAuthProfile();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [procedureTypes, setProcedureTypes] = useState<ProcedureType[]>([]);
  const [status, setStatus] = useState<RequestStatus>('INGRESADO');
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const canUpdateStatus = hasAnyRole(roles, ['Admin', 'Operador']);
  const procedureName = request
    ? resolveProcedureName(request.procedureTypeId, procedureTypes)
    : undefined;

  const loadRequest = useCallback(async () => {
    if (!id) {
      setError('No se encontró el identificador del trámite.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const [requestResponse, catalogResponse] = await Promise.allSettled([
        requestsService.getRequest(id),
        catalogService.getProcedures(),
      ]);

      if (catalogResponse.status === 'fulfilled') {
        setProcedureTypes(catalogResponse.value);
      } else {
        setProcedureTypes([]);
      }

      if (requestResponse.status === 'fulfilled') {
        setRequest(requestResponse.value);
        setStatus(requestResponse.value.status);
      } else {
        setRequest(null);
        setError(
          getApiErrorMessage(
            requestResponse.reason,
            'No fue posible cargar el detalle del trámite.',
          ),
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadRequest();
  }, [loadRequest]);

  const updateStatus = async () => {
    if (!id || !request) {
      return;
    }

    const confirmed = window.confirm(
      '¿Confirmas el cambio de estado de este trámite?',
    );

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setSuccess('');
    setError('');

    try {
      const updated = await requestsService.updateRequestStatus(id, {
        status,
        comment: comment.trim() || undefined,
      });
      setRequest(updated);
      setComment('');
      setSuccess('Estado actualizado correctamente.');
    } catch (saveError) {
      setError(
        getApiErrorMessage(
          saveError,
          'No fue posible actualizar el estado del trámite.',
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="page-stack">
      <PageHeader
        title="Detalle del trámite"
        description="Consulta y seguimiento del estado de la solicitud."
        actions={
          <Link className="button button-secondary" to="/requests">
            <ArrowLeft size={18} aria-hidden="true" />
            Volver
          </Link>
        }
      />

      {success ? <p className="success-message">{success}</p> : null}

      {isLoading ? <LoadingState message="Cargando detalle..." /> : null}
      {!isLoading && error ? (
        <ErrorState message={error} onRetry={loadRequest} />
      ) : null}

      {!isLoading && !error && request ? (
        <>
          <RequestDetails procedureName={procedureName} request={request} />

          {canUpdateStatus ? (
            <section className="form-card">
              <h2>Cambiar estado</h2>
              <div className="form-grid form-grid-inline">
                <label>
                  <span>Nuevo estado</span>
                  <select
                    onChange={(event) =>
                      setStatus(event.target.value as RequestStatus)
                    }
                    value={status}
                  >
                    {requestStatuses.map((requestStatus) => (
                      <option key={requestStatus} value={requestStatus}>
                        {requestStatus.replaceAll('_', ' ')}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Comentario</span>
                  <input
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Opcional"
                    value={comment}
                  />
                </label>
              </div>
              <Button disabled={isSaving} onClick={updateStatus}>
                <Save size={18} aria-hidden="true" />
                {isSaving ? 'Guardando...' : 'Guardar estado'}
              </Button>
            </section>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
