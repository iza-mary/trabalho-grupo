import { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (!email.trim()) {
      setStatus({ type: 'danger', message: 'Informe seu email cadastrado.' });
      return;
    }

    setSubmitting(true);
    const res = await forgotPassword(email.trim());
    setSubmitting(false);

    if (res.ok) {
      // Se estivermos em desenvolvimento sem SMTP, podemos receber um token e redirecionar
      if (res.token) {
        navigate(`/reset-password?token=${encodeURIComponent(res.token)}`);
        return;
      }
      setStatus({ type: 'success', message: 'Se houver um usuário correspondente, enviaremos instruções de redefinição.' });
    } else {
      setStatus({ type: 'danger', message: res.error || 'Não foi possível iniciar a recuperação.' });
    }
  };

  return (
    <Navbar disableSidebar minimal noMainPadding>
      <div className="content-area full-main d-flex justify-content-center align-items-start" style={{ minHeight: '100vh', paddingTop: '12vh' }}>
        <Container fluid>
          <Card style={{ width: '100%', maxWidth: 500 }} className="p-3 mx-auto">
            <Card.Body>
              <Card.Title className="mb-3">Esqueci minha senha</Card.Title>
              {status.message && (
                <Alert variant={status.type} role="alert" className="mb-3">
                  {status.message}
                </Alert>
              )}
              <Form onSubmit={handleSubmit} noValidate>
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email cadastrado</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    autoComplete="email"
                    required
                    aria-required="true"
                  />
                </Form.Group>

                <div className="d-grid" style={{ marginTop: 24 }}>
                  <Button type="submit" variant="primary" disabled={submitting} aria-disabled={submitting}>
                    {submitting ? 'Enviando...' : 'Enviar instruções'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Container>
      </div>
    </Navbar>
  );
}