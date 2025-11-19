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


  const canAttempt = () => {
    const now = Date.now();
    const lockUntil = Number(localStorage.getItem('auth_lock_until') || 0);
    if (lockUntil && now < lockUntil) {
      const ms = lockUntil - now;
      const s = Math.ceil(ms / 1000);
      return { ok: false, error: `Bloqueado temporariamente. Tente novamente em ${s}s.` };
    }
    const windowStart = Number(localStorage.getItem('auth_attempts_window') || 0);
    const windowMs = 10 * 60 * 1000;
    if (!windowStart || now - windowStart > windowMs) {
      localStorage.setItem('auth_attempts_window', String(now));
      localStorage.setItem('auth_attempts_count', '0');
    }
    return { ok: true };
  };

  const registerFailure = () => {
    const now = Date.now();
    const windowStart = Number(localStorage.getItem('auth_attempts_window') || 0);
    const count = Number(localStorage.getItem('auth_attempts_count') || 0);
    const windowMs = 10 * 60 * 1000;
    let newWindowStart = windowStart;
    let newCount = count + 1;
    if (!windowStart || now - windowStart > windowMs) {
      newWindowStart = now;
      newCount = 1;
    }
    localStorage.setItem('auth_attempts_window', String(newWindowStart));
    localStorage.setItem('auth_attempts_count', String(newCount));
    if (newCount >= 5) {
      const lockMs = 5 * 60 * 1000;
      localStorage.setItem('auth_lock_until', String(now + lockMs));
    }
  };

  const login = async (username, password) => {
    const gate = canAttempt();
    if (!gate.ok) return gate;
    const u = String(username || '').trim();
    const p = String(password || '');
    if (!u || !p) return { ok: false, error: 'Informe o nome do usuário e a senha.' };
    try {
      const res = await authService.login(u, p);
      if (res?.success && res?.user) {
        setUser(res.user);
        localStorage.removeItem('auth_lock_until');
        localStorage.removeItem('auth_attempts_window');
        localStorage.removeItem('auth_attempts_count');
        return { ok: true };
      }
      registerFailure();
      return { ok: false, error: res?.error || 'Credenciais inválidas.' };
    } catch (e) {
      registerFailure();
      const msg = e?.response?.data?.error || e.message || 'Erro ao conectar ao servidor';
      return { ok: false, error: msg };
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
/*
  AuthContext
  - Contexto global para estado de autenticação e métodos.
*/