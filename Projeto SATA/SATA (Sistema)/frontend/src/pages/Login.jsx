import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';
import Navbar from '../components/Navbar';
import PasswordField from '../components/ui/PasswordField';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, from, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const u = username.trim();
    const p = password;
    if (!u || !p) {
      setError('Informe o nome do usuário e a senha.');
      return;
    }
    if (u.length < 3) {
      setError('Usuário inválido.');
      return;
    }
    if (p.length < 4) {
      setError('Senha inválida.');
      return;
    }
    setSubmitting(true);
    const res = await login(u, p);
    setSubmitting(false);
    if (res.ok) navigate(from, { replace: true });
    else setError(res.error || 'Falha ao autenticar.');
  };

  return (
    <Navbar disableSidebar minimal noMainPadding>
      <div className="content-area full-main d-flex justify-content-center align-items-start" style={{ minHeight: '100vh', paddingTop: '12vh' }}>
        <Container fluid>
          <Card style={{ width: '100%', maxWidth: 500 }} className="p-3 mx-auto">
            <Card.Body>
              <div className="mb-3 text-center">
                <h1 className="h4 mb-1">Autenticação</h1>
                <div className="text-muted">Digite seu usuário e senha</div>
              </div>
              {error && <Alert variant="danger" role="alert">{error}</Alert>}
              <Form onSubmit={handleSubmit} noValidate>
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label>Usuário</Form.Label>
                  <Form.Control
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </Form.Group>
                <PasswordField
                  id="password"
                  label="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <div className="d-grid" style={{ marginTop: 24 }}>
                  <Button type="submit" variant="primary" disabled={submitting}>
                    {submitting ? 'Entrando...' : 'Entrar'}
                  </Button>
                </div>
                <div className="mt-3 text-center">
                  <a href="/forgot-password" className="text-muted">Esqueci minha senha</a>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Container>
      </div>
    </Navbar>
  );
}
/*
  Página Login
  - Autenticação do usuário com feedback de erro e redirecionamento.
*/