import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
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

    if (!username.trim() || !password.trim()) {
      setError('Informe o nome do usuário e a senha.');
      return;
    }

    setSubmitting(true);
    const result = await login(username.trim(), password);
    setSubmitting(false);

    if (result.ok) {
      navigate(from, { replace: true });
    } else {
      setError(result.error || 'Falha ao autenticar.');
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <h1 className="mb-4">Acesso ao Sistema</h1>
          {error && (
            <Alert variant="danger" role="alert">
              {error}
            </Alert>
          )}
          <Form onSubmit={handleSubmit} noValidate aria-label="Formulário de login">
            <Form.Group className="mb-3" controlId="username">
              <Form.Label>Nome do Usuário</Form.Label>
              <Form.Control
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
                autoComplete="username"
                required
                aria-required="true"
              />
            </Form.Group>

            {/* Password with toggle */}
            <PasswordField
              id="password"
              label="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required={true}
              ariaRequired={true}
            />

            <div className="d-grid gap-2">
              <Button type="submit" variant="primary" disabled={submitting} aria-disabled={submitting}>
                {submitting ? 'Entrando...' : 'Entrar'}
              </Button>
              <div className="text-center">
                <Link to="/forgot-password">Esqueci minha senha</Link> · <Link to="/register">Criar conta</Link>
              </div>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}