import { useEffect, useState } from 'react';
import { AuthContext } from './AuthContextBase';
import authService from '../services/authService';

// Removido createContext local; usamos AuthContext do arquivo base

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await authService.me();
        if (mounted && res?.success) setUser(res.user);
      } catch {
        // silenciosamente continua não autenticado
        void 0;
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const login = async (username, password) => {
    try {
      const res = await authService.login(username, password);
      if (res?.success) {
        setUser(res.user);
        return { ok: true };
      }
      return { ok: false, error: res?.error || 'Falha no login' };
    } catch (e) {
      return { ok: false, error: e?.response?.data?.error || e.message || 'Erro ao autenticar' };
    }
  };

  const logout = async () => {
    try { await authService.logout(); } catch {
      // ignorar erros de logout
      void 0;
    }
    setUser(null);
  };

  const forgotPassword = async (email) => {
    try {
      const res = await authService.forgotPassword(email);
      if (res?.success) return { ok: true, token: res?.token };
      return { ok: false, error: res?.error || 'Falha ao iniciar recuperação' };
    } catch (e) {
      return { ok: false, error: e?.response?.data?.error || e.message || 'Erro ao iniciar recuperação' };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const res = await authService.resetPassword(token, newPassword);
      if (res?.success) return { ok: true };
      return { ok: false, error: res?.error || 'Falha ao redefinir senha' };
    } catch (e) {
      return { ok: false, error: e?.response?.data?.error || e.message || 'Erro ao redefinir senha' };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await authService.changePassword(currentPassword, newPassword);
      if (res?.success) return { ok: true };
      return { ok: false, error: res?.error || 'Falha ao trocar senha' };
    } catch (e) {
      return { ok: false, error: e?.response?.data?.error || e.message || 'Erro ao trocar senha' };
    }
  };

  const register = async ({ username, email, password, role }) => {
    try {
      const res = await authService.register({ username, email, password, role });
      if (res?.success) return { ok: true, data: res.data };
      return { ok: false, error: res?.error || 'Falha ao cadastrar' };
    } catch (e) {
      return { ok: false, error: e?.response?.data?.error || e.message || 'Erro ao cadastrar' };
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    register,
    isAdmin: user?.role === 'Admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Removido export useAuth daqui para evitar incompatibilidades do Fast Refresh