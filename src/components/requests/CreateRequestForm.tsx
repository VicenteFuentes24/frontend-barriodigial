import { Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { ProcedureType } from '../../types/catalog';
import type { CreateRequestPayload } from '../../types/request';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';

interface CreateRequestFormProps {
  procedureTypes: ProcedureType[];
  isSubmitting: boolean;
  onSubmit: (payload: CreateRequestPayload) => Promise<void>;
}

export default function CreateRequestForm({
  procedureTypes,
  isSubmitting,
  onSubmit,
}: CreateRequestFormProps) {
  const [procedureTypeId, setProcedureTypeId] = useState('');
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState('');

  if (procedureTypes.length === 0) {
    return (
      <EmptyState
        title="No hay tipos de trámite disponibles"
        description="El formulario quedará habilitado cuando el catálogo responda con tipos reales."
      />
    );
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError('');

    if (!procedureTypeId) {
      setValidationError('Selecciona un tipo de trámite.');
      return;
    }

    if (description.trim().length < 10) {
      setValidationError('Describe la solicitud con al menos 10 caracteres.');
      return;
    }

    await onSubmit({
      procedureTypeId,
      description: description.trim(),
    });

    setProcedureTypeId('');
    setDescription('');
  };

  return (
    <form className="form-card" onSubmit={submit}>
      <div className="form-grid">
        <label>
          <span>Tipo de trámite</span>
          <select
            onChange={(event) => setProcedureTypeId(event.target.value)}
            value={procedureTypeId}
          >
            <option value="">Selecciona una opción</option>
            {procedureTypes.map((procedureType) => (
              <option key={procedureType.id} value={procedureType.id}>
                {procedureType.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Descripción</span>
          <textarea
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Explica brevemente tu solicitud"
            rows={4}
            value={description}
          />
        </label>
      </div>

      {validationError ? <p className="form-error">{validationError}</p> : null}

      <Button disabled={isSubmitting} type="submit">
        <Send size={18} aria-hidden="true" />
        {isSubmitting ? 'Enviando...' : 'Ingresar trámite'}
      </Button>
    </form>
  );
}
