import { Role, rolePermissions } from '../../domain/enums/roles';
import { useAuthStore } from './authStore';

export const hasPermission = (permission: string): boolean => {
  const user = useAuthStore.getState().user;
  if (!user) return false;

  const permissions = rolePermissions[user.role] || [];
  return permissions.includes(permission);
};

export const hasAnyPermission = (permissions: string[]): boolean => {
  return permissions.some(hasPermission);
};

export const hasAllPermissions = (permissions: string[]): boolean => {
  return permissions.every(hasPermission);
};

export const hasRole = (roles: Role | Role[]): boolean => {
  const user = useAuthStore.getState().user;
  if (!user) return false;

  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(user.role);
};

export const usePermissions = () => {
  const user = useAuthStore((state) => state.user);

  return {
    hasPermission: (permission: string) => {
      if (!user) return false;
      const permissions = rolePermissions[user.role] || [];
      return permissions.includes(permission);
    },
    hasRole: (roles: Role | Role[]) => {
      if (!user) return false;
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(user.role);
    },
    userRole: user?.role,
  };
};
