export interface ProcedureType {
  id: string;
  name: string;
  requirements?: string[];
  dailyQuota?: number | null;
  available?: boolean | null;
  active?: boolean;
}

export interface UpsertProcedurePayload {
  name: string;
  requirements: string[];
  dailyQuota?: number | null;
  available: boolean;
}
