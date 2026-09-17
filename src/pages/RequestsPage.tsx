import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { hasAnyRole } from '../auth/authUtils';
import CreateRequestForm from '../components/requests/CreateRequestForm';
import RequestList from '../components/requests/RequestList';
import Button from '../components/ui/Button';
import ErrorState from '../components/ui/ErrorState';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import { useAuthProfile } from '../hooks/useAuthProfile';
import { getApiErrorMessage } from '../services/apiClient';
import { catalogService } from '../services/catalogService';
import { requestsService } from '../services/requestsService';
import type { ProcedureType } from '../types/catalog';
import type { CreateRequestPayload, ServiceRequest } from '../types/request';

export default function RequestsPage() {
  const { roles } = useAuthProfile();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [procedureTypes, setProcedureTypes] = useState<ProcedureType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [catalogError, setCatalogError] = useState('');
  const [success, setSuccess] = useState('');
  const canCreate = hasAnyRole(roles, ['Cliente', 'Operador', 'Admin']);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setCatalogError('');

    try {
      const [requestsResponse, catalogResponse] = await Promise.allSettled([
        requestsService.getRequests(),
        catalogService.getProcedures(),
      ]);

      if (requestsResponse.status === 'fulfilled') {
        setRequests(requestsResponse.value);
      } else {
        setRequests([]);
        setError(
          getApiErrorMessage(
            requestsResponse.reason,
            'No fue posible cargar los trámites.',
          ),
        );
      }

      if (catalogResponse.status === 'fulfilled') {
        setProcedureTypes(catalogResponse.value);
      } else {
        setProcedureTypes([]);
        setCatalogError(
          getApiErrorMessage(
            catalogResponse.reason,
            'No fue posible cargar los tipos de trámite.',
          ),
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const createRequest = async (payload: CreateRequestPayload) => {
    setIsSubmitting(true);
    setSuccess('');
    setError('');

    try {
      await requestsService.createRequest(payload);
      setSuccess('Solicitud ingresada correctamente.');
      await loadRequests();
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          'No fue posible ingresar el trámite.',
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="page-stack">
      <PageHeader
        title="Trámites"
        description="Ingreso y gestión de solicitudes comunales conectadas a /api/requests."
        actions={
          <Button onClick={loadRequests} variant="secondary">
            <RefreshCw size={18} aria-hidden="true" />
            Actualizar
          </Button>
        }
      />

      {canCreate ? (
        <section className="section-stack">
          <h2>Crear trámite</h2>
          {catalogError ? <p className="form-error">{catalogError}</p> : null}
          <CreateRequestForm
            isSubmitting={isSubmitting}
            onSubmit={createRequest}
            procedureTypes={procedureTypes}
          />
        </section>
      ) : null}

      {success ? <p className="success-message">{success}</p> : null}

      {isLoading ? <LoadingState message="Cargando trámites..." /> : null}
      {!isLoading && error ? (
        <ErrorState message={error} onRetry={loadRequests} />
      ) : null}
      {!isLoading && !error ? <RequestList procedureTypes={procedureTypes} requests={requests} /> : null}
    </section>
  );
}



