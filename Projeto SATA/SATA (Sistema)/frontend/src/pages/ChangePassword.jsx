import { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import Navbar from '../components/Navbar';
import PasswordField from '../components/ui/PasswordField';
import authService from '../services/authService';

export default function ChangePassword() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePolicy = (v) => {
    const hasNum = /\d/.test(String(v));
    if (String(v).length < 8 || !hasNum) return 'A senha deve ter ao menos 8 caracteres e 1 número';
    return '';
  };

  const nextErr = validatePolicy(next);
  const confirmErr = confirm && next !== confirm ? 'As senhas não coincidem' : '';
  const canSubmit = current && !nextErr && !confirmErr && next && confirm;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await authService.changePassword(current, next);
      if (res?.success) {
        setSuccess('Senha atualizada com sucesso');
        setCurrent(''); setNext(''); setConfirm('');
      } else {
        setError(res?.error || 'Falha ao atualizar a senha');
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Erro ao atualizar a senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Navbar disableSidebar minimal noMainPadding>
      <div className="content-area full-main d-flex justify-content-center align-items-start" style={{ minHeight: '100vh', paddingTop: '12vh' }}>
        <Container fluid>
          <Card style={{ width: '100%', maxWidth: 500 }} className="p-3 mx-auto">
            <Card.Body>
              <Card.Title className="mb-3">Trocar senha</Card.Title>

              {error && (
                <Alert variant="danger" role="alert" className="mb-3">{error}</Alert>
              )}
              {success && (
                <Alert variant="success" role="alert" className="mb-3">{success}</Alert>
              )}

              <Form onSubmit={onSubmit} noValidate>
                <PasswordField
                  id="current_password"
                  label="Senha atual"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  required
                  ariaRequired
                  autoComplete="current-password"
                  groupClassName="mb-3"
                />

                <div style={{ marginTop: 24 }}>
                  <PasswordField
                    id="new_password"
                    label="Nova senha"
                    value={next}
                    onChange={(e) => setNext(e.target.value)}
                    required
                    ariaRequired
                    autoComplete="new-password"
                    isInvalid={!!nextErr}
                    feedback={nextErr}
                  />
                </div>

                <div style={{ marginTop: 24 }}>
                  <PasswordField
                    id="confirm_password"
                    label="Confirmar nova senha"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    ariaRequired
                    autoComplete="new-password"
                    isInvalid={!!confirmErr}
                    feedback={confirmErr}
                  />
                </div>

                <div style={{ marginTop: 24 }} className="d-grid">
                  <Button type="submit" variant="primary" disabled={!canSubmit || loading} aria-disabled={!canSubmit || loading}>
                    {loading ? (
                      <span className="d-flex align-items-center justify-content-center gap-2">
                        <Spinner animation="border" size="sm" />
                        Salvando...
                      </span>
                    ) : (
                      'Salvar'
                    )}
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