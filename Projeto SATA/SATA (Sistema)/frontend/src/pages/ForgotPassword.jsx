import { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../hooks/useAuth';

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (!username.trim()) {
      setStatus({ type: 'danger', message: 'Informe seu nome de usuário.' });
      return;
    }

    setSubmitting(true);
    const res = await forgotPassword(username.trim());
    setSubmitting(false);

    if (res.ok) {
      setStatus({ type: 'success', message: 'Se houver um usuário correspondente, enviaremos instruções de redefinição (em ambiente de desenvolvimento, contate o administrador).' });
    } else {
      setStatus({ type: 'danger', message: res.error || 'Não foi possível iniciar a recuperação.' });
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <h1 className="mb-4">Esqueci minha senha</h1>
          {status.message && (
            <Alert variant={status.type} role="alert">
              {status.message}
            </Alert>
          )}
          <Form onSubmit={handleSubmit} noValidate>
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

            <div className="d-grid">
              <Button type="submit" variant="primary" disabled={submitting} aria-disabled={submitting}>
                {submitting ? 'Enviando...' : 'Enviar instruções'}
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}