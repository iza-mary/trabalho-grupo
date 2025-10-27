import { Navbar, Container, Nav, Button, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function UserBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      await logout();
    } finally {
      setShowLogoutConfirm(false);
      navigate('/login');
    }
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

      {/* Confirmação de logout */}
      <Modal show={showLogoutConfirm} onHide={() => setShowLogoutConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar saída</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Deseja sair do perfil e encerrar a sessão?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLogoutConfirm(false)}>Cancelar</Button>
          <Button variant="danger" onClick={confirmLogout}>Sair</Button>
        </Modal.Footer>
      </Modal>
    </Navbar>
  );
}