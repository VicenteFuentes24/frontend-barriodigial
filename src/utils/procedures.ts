import type { ProcedureType } from '../types/catalog';

export function resolveProcedureName(
  procedureTypeId: string | undefined,
  procedures: ProcedureType[],
) {
  const normalizedId = procedureTypeId?.trim();

  if (!normalizedId) {
    return undefined;
  }

  const procedure = procedures.find(
    (item) => String(item.id).trim() === normalizedId,
  );

  return procedure?.name?.trim() || 'Tipo #' + normalizedId;
}
