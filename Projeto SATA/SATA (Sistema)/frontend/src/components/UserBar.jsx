import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function UserBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Navbar bg="light" expand="md" className="mb-3" role="navigation">
      <Container>
        <Navbar.Brand as={Link} to="/">SATA</Navbar.Brand>
        <Navbar.Toggle aria-controls="userbar-nav" />
        <Navbar.Collapse id="userbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/idosos">Idosos</Nav.Link>
            <Nav.Link as={Link} to="/doacoes">Doações</Nav.Link>
            <Nav.Link as={Link} to="/eventos">Eventos</Nav.Link>
            <Nav.Link as={Link} to="/financeiro">Financeiro</Nav.Link>
          </Nav>
          <div className="d-flex align-items-center gap-3">
            <span aria-live="polite">
              {user ? (
                <>
                  <strong>{user.username}</strong> · <span>{user.role}</span>
                </>
              ) : (
                'Não autenticado'
              )}
            </span>
            {user && (
              <Button variant="outline-danger" size="sm" onClick={handleLogout} aria-label="Sair">
                Sair
              </Button>
            )}
            <Button as={Link} to="/perfil" variant="outline-primary" size="sm" aria-label="Perfil">
              Perfil
            </Button>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}