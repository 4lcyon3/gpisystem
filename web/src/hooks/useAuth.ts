import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const store = useAuthStore();
  
  return {
    user: store.user,
    roles: store.roles,
    menu: store.menu,
    permissions: store.permissions,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    
    login: store.login,
    logout: store.logout,
    hasRole: store.hasRole,
    hasAnyRole: store.hasAnyRole,
    
    // Helpers específicos por rol
    isAdmin: store.roles.includes('Administrador'),
    isAnalista: store.roles.includes('Analista'),
    isAuditor: store.roles.includes('Auditor'),
    
    canEdit: store.permissions.can_edit,
    canUpload: store.permissions.can_upload,
    canConfigure: store.permissions.can_configure,
  };
}