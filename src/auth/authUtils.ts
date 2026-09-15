import type { AccountInfo } from '@azure/msal-browser';
import {
  appRoles,
  type AppRole,
  type UserProfile,
  type ValidatedBffMeResponse,
} from '../types/auth';

export function isAppRole(role: string): role is AppRole {
  return appRoles.includes(role as AppRole);
}

export function filterAppRoles(roles: string[]): AppRole[] {
  return roles.filter(isAppRole);
}

export function hasRole(userRoles: AppRole[], role: AppRole) {
  return userRoles.includes(role);
}

export function hasAnyRole(userRoles: AppRole[], allowedRoles: AppRole[]) {
  if (allowedRoles.length === 0) {
    return true;
  }

  return userRoles.some((role) => allowedRoles.includes(role));
}

export function getDisplayName(account?: AccountInfo | null) {
  return account?.name ?? 'Usuario';
}

export function getUserEmail(account?: AccountInfo | null) {
  return account?.username ?? 'correo no disponible';
}

export function getInitials(name: string, email: string) {
  const source = name !== 'Usuario' ? name : email;
  const initials = source
    .split(/[.\s@_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return initials || 'BD';
}

export function buildUserProfileFromBff(
  me: ValidatedBffMeResponse,
): UserProfile {
  const name = me.name.trim() || 'Usuario';
  const email = me.username.trim() || 'correo no disponible';

  return {
    name,
    email,
    initials: getInitials(name, email),
    roles: me.roles,
    primaryRole: me.roles[0],
  };
}
