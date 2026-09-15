import { Edit2, Plus, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { hasRole } from '../auth/authUtils';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import { useAuthProfile } from '../hooks/useAuthProfile';
import { getApiErrorMessage } from '../services/apiClient';
import { catalogService } from '../services/catalogService';
import type { ProcedureType, UpsertProcedurePayload } from '../types/catalog';
import { formatNumber } from '../utils/format';

interface ProcedureFormState {
  name: string;
  requirements: string;
  dailyQuota: string;
}

const emptyForm: ProcedureFormState = {
  name: '',
  requirements: '',
  dailyQuota: '',
};

export default function CatalogPage() {
  const { roles } = useAuthProfile();
  const [procedures, setProcedures] = useState<ProcedureType[]>([]);
  const [form, setForm] = useState<ProcedureFormState>(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const canManage = hasRole(roles, 'Admin');

  const loadCatalog = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      setProcedures(await catalogService.getProcedures());
    } catch (loadError) {
      setProcedures([]);
      setError(
        getApiErrorMessage(
          loadError,
          'No fue posible cargar el catálogo.',
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const payloadFromForm = (): UpsertProcedurePayload => ({
    name: form.name.trim(),
    requirements: form.requirements
      .split('\n')
      .map((requirement) => requirement.trim())
      .filter(Boolean),
    dailyQuota: form.dailyQuota ? Number(form.dailyQuota) : null,
  });

  const saveProcedure = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setSuccess('');

    if (!form.name.trim()) {
      setFormError('Ingresa el nombre del tipo de trámite.');
      return;
    }

    setIsSaving(true);

    try {
      const payload = payloadFromForm();

      if (editingId) {
        await catalogService.updateProcedure(editingId, payload);
        setSuccess('Tipo de trámite actualizado.');
      } else {
        await catalogService.createProcedure(payload);
        setSuccess('Tipo de trámite creado.');
      }

      setForm(emptyForm);
      setEditingId('');
      await loadCatalog();
    } catch (saveError) {
      setFormError(
        getApiErrorMessage(
          saveError,
          'No fue posible guardar el tipo de trámite.',
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const editProcedure = (procedure: ProcedureType) => {
    setEditingId(procedure.id);
    setForm({
      name: procedure.name,
      requirements: procedure.requirements?.join('\n') ?? '',
      dailyQuota:
        procedure.dailyQuota === null || procedure.dailyQuota === undefined
          ? ''
          : String(procedure.dailyQuota),
    });
  };

  return (
    <section className="page-stack">
      <PageHeader
        title="Catálogo"
        description="Tipos de trámite y cupos preparados para /api/catalog/procedures."
        actions={
          <Button onClick={loadCatalog} variant="secondary">
            <RefreshCw size={18} aria-hidden="true" />
            Actualizar
          </Button>
        }
      />

      {canManage ? (
        <form className="form-card" onSubmit={saveProcedure}>
          <h2>{editingId ? 'Editar tipo de trámite' : 'Nuevo tipo de trámite'}</h2>
          <div className="form-grid">
            <label>
              <span>Nombre</span>
              <input
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                value={form.name}
              />
            </label>
            <label>
              <span>Requisitos</span>
              <textarea
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    requirements: event.target.value,
                  }))
                }
                placeholder="Un requisito por línea"
                rows={4}
                value={form.requirements}
              />
            </label>
            <label>
              <span>Cupo diario</span>
              <input
                min="0"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    dailyQuota: event.target.value,
                  }))
                }
                type="number"
                value={form.dailyQuota}
              />
            </label>
          </div>
          {formError ? <p className="form-error">{formError}</p> : null}
          {success ? <p className="success-message">{success}</p> : null}
          <div className="form-actions">
            <Button disabled={isSaving} type="submit">
              {editingId ? (
                <Edit2 size={18} aria-hidden="true" />
              ) : (
                <Plus size={18} aria-hidden="true" />
              )}
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
            {editingId ? (
              <Button
                onClick={() => {
                  setEditingId('');
                  setForm(emptyForm);
                }}
                variant="ghost"
              >
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}

      {isLoading ? <LoadingState message="Cargando catálogo..." /> : null}
      {!isLoading && error ? (
        <ErrorState message={error} onRetry={loadCatalog} />
      ) : null}
      {!isLoading && !error && procedures.length === 0 ? (
        <EmptyState title="No hay tipos de trámite disponibles." />
      ) : null}
      {!isLoading && !error && procedures.length > 0 ? (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Requisitos</th>
                <th>Cupo diario</th>
                <th>Disponibilidad</th>
                {canManage ? <th>Acción</th> : null}
              </tr>
            </thead>
            <tbody>
              {procedures.map((procedure) => (
                <tr key={procedure.id}>
                  <td>
                    <strong>{procedure.name}</strong>
                    <span>{procedure.id}</span>
                  </td>
                  <td>
                    {procedure.requirements && procedure.requirements.length > 0
                      ? procedure.requirements.join(', ')
                      : '---'}
                  </td>
                  <td>{formatNumber(procedure.dailyQuota)}</td>
                  <td>
                    {procedure.available === undefined ||
                    procedure.available === null
                      ? 'Sin información'
                      : procedure.available
                        ? 'Disponible'
                        : 'No disponible'}
                  </td>
                  {canManage ? (
                    <td>
                      <Button
                        onClick={() => editProcedure(procedure)}
                        variant="ghost"
                      >
                        <Edit2 size={16} aria-hidden="true" />
                        Editar
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

