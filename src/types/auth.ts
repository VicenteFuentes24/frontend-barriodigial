export const appRoles = ['Admin', 'Operador', 'Cliente', 'Auditor'] as const;

export type AppRole = (typeof appRoles)[number];

export interface BffMeResponse {
  subject: string;
  name: string;
  username: string;
  roles: string[];
  scopes: string[];
  issuer: string;
  audience: string[];
  expiresAt: string;
}

export type ValidatedBffMeResponse = Omit<BffMeResponse, 'roles'> & {
  roles: AppRole[];
};

export interface UserProfile {
  name: string;
  email: string;
  initials: string;
  roles: AppRole[];
  primaryRole?: AppRole;
}
