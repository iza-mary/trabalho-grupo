/*
  Rota Protegida
  - Controla acesso a páginas com base em autenticação e papel do usuário.
  - Redireciona para login quando não autenticado e exibe aviso quando papel não é permitido.
*/
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Spinner } from 'react-bootstrap';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Normaliza papel para comparação consistente
  const normalizeRole = (role) => {
    if (!role) return role;
    const r = String(role).toLowerCase();
    if (r.includes('admin')) return 'Admin';
    if (r.includes('funcionario') || r.includes('funcionário')) return 'Funcionário';
    return role;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '40vh' }}>
        <Spinner animation="border" role="status" aria-label="Carregando">
          <span className="visually-hidden">Carregando...</span>
        </Spinner>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const normalizedAllowed = allowedRoles.map(normalizeRole);
    const userRole = normalizeRole(user.role);
    if (!normalizedAllowed.includes(userRole)) {
      return (
        <div className="container mt-4">
          <div className="alert alert-warning" role="alert">
            Acesso restrito - Esta funcionalidade é exclusiva para administradores
          </div>
        </div>
      );
    }
  }

  return (
    <>
      {children}
    </>
  );
}