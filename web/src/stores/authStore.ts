import { create } from 'zustand';
import { api } from '@/lib/axios';

export interface User {
  id: string;
  username: string;
  email: string;
  activo: boolean;
}

export interface MenuPermission {
  can_edit: boolean;
  can_upload: boolean;
  can_configure: boolean;
}

export interface MenuItem {
  id: number;
  nombre: string;
  icono: string;
  ruta: string;
}

interface AuthState {
  user: User | null;
  roles: string[];
  menu: MenuItem[];
  permissions: MenuPermission;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  fetchMenu: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  roles: [],
  menu: [],
  permissions: {
    can_edit: false,
    can_upload: false,
    can_configure: false,
  },
  isAuthenticated: false,
  isLoading: true,

  login: async (username: string, password: string) => {
    await api.post('/auth/login', { username, password });
    await useAuthStore.getState().fetchUser();
    await useAuthStore.getState().fetchMenu();
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      set({
        user: null,
        roles: [],
        menu: [],
        permissions: {
          can_edit: false,
          can_upload: false,
          can_configure: false,
        },
        isAuthenticated: false,
      });
    }
  },

  fetchUser: async () => {
    try {
      const response = await api.get('/auth/me');
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error;
    }
  },

  fetchMenu: async () => {
    try {
      const response = await api.get('/auth/menu');
      set({
        roles: response.data.roles,
        menu: response.data.menu,
        permissions: response.data.permissions,
      });
    } catch (error) {
      console.error('Error fetching menu:', error);
    }
  },
  
  hasRole: (role: string) => {
    return get().roles.includes(role);
  },

  hasAnyRole: (roles: string[]) => {
    return roles.some(role => get().roles.includes(role));
  },
}));