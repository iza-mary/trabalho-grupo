import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PasswordField from '../components/ui/PasswordField';

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const isAcceptablePassword = (pw) => {
    if (!pw || pw.length < 8) return false;
    const lower = pw.toLowerCase();
    const common = ['12345678','123456789','password','qwerty','abc123','111111','123123','senha','admin'];
    if (common.includes(lower)) return false;
    if (/^(.)\1{7,}$/.test(pw)) return false; // caracteres repetidos
    if (lower.includes('abcdefghijklmnopqrstuvwxyz') || lower.includes('12345678')) return false; // sequências muito simples
    return true;
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('token');
    if (t) setToken(t);
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (!token) {
      setStatus({ type: 'danger', message: 'Link inválido ou expirado. Acesse o link enviado por email.' });
      return;
    }
    if (!newPassword || !isAcceptablePassword(newPassword)) {
      setStatus({
        type: 'danger',
        message: 'Senha fraca: mínimo 8 caracteres e evite senhas comuns (ex.: 12345678, password).',
      });
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