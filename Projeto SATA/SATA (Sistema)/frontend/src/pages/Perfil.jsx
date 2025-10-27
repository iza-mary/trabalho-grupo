import { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, Card } from 'react-bootstrap';
import { useAuth } from '../hooks/useAuth';
import PasswordField from '../components/ui/PasswordField';
import Navbar from '../components/Navbar';

export default function Perfil() {
  const { user, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const isAcceptablePassword = (pw) => {
    if (!pw || pw.length < 8) return false;
    const lower = pw.toLowerCase();
    const common = ['12345678','123456789','password','qwerty','abc123','111111','123123','senha','admin'];
    if (common.includes(lower)) return false;
    if (/^(.)\1{7,}$/.test(pw)) return false; // repetição simples
    if (lower.includes('abcdefghijklmnopqrstuvwxyz') || lower.includes('12345678')) return false; // sequências triviais
    return true;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (!currentPassword || !newPassword) {
      setStatus({ type: 'danger', message: 'Preencha a senha atual e a nova.' });
      return;
    }
    if (!isAcceptablePassword(newPassword)) {
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
    const res = await changePassword(currentPassword, newPassword);
    setSubmitting(false);

    if (res.ok) {
      setStatus({ type: 'success', message: 'Senha alterada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setStatus({ type: 'danger', message: res.error || 'Não foi possível alterar a senha.' });
    }
  };

  return (
    <Navbar>
      <div className="content-area full-main">
        <div className="d-flex flex-column justify-content-center" style={{ minHeight: 'inherit' }}>
          <Container fluid>
            <Row className="justify-content-center">
              <Col md={8} lg={6}>
                <Card className="mb-4">
                  <Card.Body>
                    <Card.Title>Informações do Usuário</Card.Title>
                    <Card.Text>
                      <strong>Usuário:</strong> {user?.username || '-'}<br />
                      <strong>Nível de acesso:</strong> {user?.role || '-'}
                    </Card.Text>
                  </Card.Body>
                </Card>

                <h2 className="mb-3">Trocar senha</h2>
                {status.message && (
                  <Alert variant={status.type} role="alert">
                    {status.message}
                  </Alert>
                )}
                <Form onSubmit={handleChangePassword} noValidate>
                  {/* Senha atual */}
                  <PasswordField
                    id="currentPassword"
                    label="Senha atual"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    required={true}
                    ariaRequired={true}
                  />
                  {/* Nova senha */}
                  <PasswordField
                    id="newPassword"
                    label="Nova senha"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required={true}
                    ariaRequired={true}
                  />
                  {/* Confirmar nova senha */}
                  <PasswordField
                    id="confirmPassword"
                    label="Confirmar nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required={true}
                    ariaRequired={true}
                  />
                  <div className="d-grid">
                    <Button type="submit" variant="primary" disabled={submitting} aria-disabled={submitting}>
                      {submitting ? 'Atualizando...' : 'Atualizar senha'}
                    </Button>
                  </div>
                </Form>
              </Col>
            </Row>
          </Container>
        </div>
      </div>
    </Navbar>
  );
}