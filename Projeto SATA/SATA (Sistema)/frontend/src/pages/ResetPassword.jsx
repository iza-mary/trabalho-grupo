import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Container, Card, Form, Button, InputGroup, Alert } from 'react-bootstrap';
import { Eye, EyeSlash } from 'react-bootstrap-icons';
import authService from '../services/authService';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('token') || '';
    setToken(t);
  }, [location.search]);

  const validate = () => {
    const p = String(password || '');
    const c = String(confirm || '');
    if (p.length < 8 || !/\d/.test(p)) return 'A senha deve ter ao menos 8 caracteres e 1 número';
    if (p !== c) return 'As senhas não coincidem';
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const err = validate();
    if (err) { setError(err); return; }
    setSubmitting(true);
    try {
      const res = await authService.resetPassword(token, password);
      if (res?.success) {
        setSuccess('Senha redefinida com sucesso. Você já pode fazer login.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(res?.error || 'Falha ao redefinir senha');
      }
    } catch (e2) {
      setError(e2?.response?.data?.error || e2.message || 'Erro ao redefinir senha');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Navbar>
      <div className="content-area full-main">
        <Container className="py-4" style={{ maxWidth: 680 }}>
          <Card>
            <Card.Body>
              <h4 className="mb-3">Redefinir senha</h4>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              <Form onSubmit={submit} noValidate>
                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>Nova senha</Form.Label>
                  <InputGroup>
                    <Form.Control type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <Button variant="outline-secondary" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}>
                      {showPw ? <EyeSlash /> : <Eye />}
                    </Button>
                  </InputGroup>
                  <Form.Text className="text-muted">A senha deve ter ao menos 8 caracteres e 1 número.</Form.Text>
                </Form.Group>

                <Form.Group className="mb-3" controlId="confirm">
                  <Form.Label>Confirmar nova senha</Form.Label>
                  <InputGroup>
                    <Form.Control type={showConfirm ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
                    <Button variant="outline-secondary" onClick={() => setShowConfirm(v => !v)} aria-label={showConfirm ? 'Ocultar confirmação' : 'Mostrar confirmação'}>
                      {showConfirm ? <EyeSlash /> : <Eye />}
                    </Button>
                  </InputGroup>
                </Form.Group>

                <div className="d-grid">
                  <Button type="submit" variant="primary" disabled={submitting || !token}>
                    {submitting ? 'Enviando...' : 'Redefinir senha'}
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
/*
  Página Reset de Senha
  - Consome token e aplica nova senha conforme política.
*/