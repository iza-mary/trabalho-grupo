import { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PasswordField from '../components/ui/PasswordField';

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (!token.trim()) {
      setStatus({ type: 'danger', message: 'Informe o token de redefinição.' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setStatus({ type: 'danger', message: 'A nova senha deve ter pelo menos 6 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'danger', message: 'A confirmação da nova senha não confere.' });
      return;
    }

    setSubmitting(true);
    const res = await resetPassword(token.trim(), newPassword);
    setSubmitting(false);

    if (res.ok) {
      setStatus({ type: 'success', message: 'Senha redefinida com sucesso! Você já pode entrar.' });
      setTimeout(() => navigate('/login'), 1500);
    } else {
      setStatus({ type: 'danger', message: res.error || 'Não foi possível redefinir a senha.' });
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <h1 className="mb-4">Redefinir Senha</h1>
          {status.message && (
            <Alert variant={status.type} role="alert">
              {status.message}
            </Alert>
          )}
          <Form onSubmit={handleSubmit} noValidate>
            <Form.Group className="mb-3" controlId="token">
              <Form.Label>Token de redefinição</Form.Label>
              <Form.Control
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Cole aqui o token recebido"
                required
                aria-required="true"
              />
            </Form.Group>

            {/* Nova senha com toggle */}
            <PasswordField
              id="newPassword"
              label="Nova senha"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Digite a nova senha"
              autoComplete="new-password"
              required={true}
              ariaRequired={true}
            />

            {/* Confirmar nova senha com toggle */}
            <PasswordField
              id="confirmPassword"
              label="Confirmar nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme a nova senha"
              autoComplete="new-password"
              required={true}
              ariaRequired={true}
            />

            <div className="d-grid">
              <Button type="submit" variant="primary" disabled={submitting} aria-disabled={submitting}>
                {submitting ? 'Redefinindo...' : 'Redefinir senha'}
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}