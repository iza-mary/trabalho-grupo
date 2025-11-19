import { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import Navbar from '../components/Navbar';
import authService from '../services/authService';

export default function Usuarios() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState('Funcionário');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState({ usernameAvailable: null, emailAvailable: null });

  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState({ type: '', message: '' });
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const isValidEmail = (v) => {
    const s = String(v || '').trim();
    if (!s) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(s);
  };

  const passwordError = useMemo(() => {
    const pw = String(password || '').trim();
    if (!pw) return 'Informe uma senha';
    if (pw.length < 8) return 'Senha deve ter pelo menos 8 caracteres';
    const lower = pw.toLowerCase();
    const commonSet = new Set(['123456','12345678','123456789','1234567890','password','qwerty','abc123','111111','123123','senha','admin','letmein']);
    if (commonSet.has(lower)) return 'Senha muito comum, escolha outra';
    if (/^(.)\1{7,}$/.test(pw)) return 'Senha muito simples, evite caracteres repetidos';
    const sequences = ['0123456789','1234567890','abcdefghijklmnopqrstuvwxyz'];
    for (const seq of sequences) {
      if (lower.includes(seq.substring(0, 8))) return 'Senha sequencial muito simples, escolha outra';
    }
    return null;
  }, [password]);

  useEffect(() => {
    let timer = null;
    const u = String(username || '').trim();
    const e = String(email || '').trim();
    const shouldCheck = (u && u.length >= 3) || (e && isValidEmail(e));
    if (!shouldCheck) {
      setAvailability({ usernameAvailable: null, emailAvailable: null });
      return;
    }
    setChecking(true);
    timer = setTimeout(async () => {
      try {
        const res = await authService.checkUnique({ username: u || undefined, email: e || undefined });
        const ok = res?.success ?? true;
        const r = res?.data ?? res ?? {};
        if (ok) {
          setAvailability({
            usernameAvailable: u ? !!(r.usernameAvailable ?? r?.data?.usernameAvailable) : null,
            emailAvailable: e ? !!(r.emailAvailable ?? r?.data?.emailAvailable) : null,
          });
        }
      } finally {
        setChecking(false);
      }
    }, 350);
    return () => { if (timer) clearTimeout(timer); };
  }, [username, email]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    const u = String(username || '').trim();
    const em = String(email || '').trim();
    const r = String(role || 'Funcionário');
    if (!u || u.length < 3) { setStatus({ type: 'danger', message: 'Informe um nome de usuário válido.' }); return; }
    if (!isValidEmail(em)) { setStatus({ type: 'danger', message: 'Informe um email válido.' }); return; }
    if (availability.usernameAvailable === false) { setStatus({ type: 'danger', message: 'Nome de usuário já utilizado.' }); return; }
    if (availability.emailAvailable === false) { setStatus({ type: 'danger', message: 'Email já utilizado.' }); return; }
    if (passwordError) { setStatus({ type: 'danger', message: passwordError }); return; }
    if (password !== confirm) { setStatus({ type: 'danger', message: 'A confirmação da senha não confere.' }); return; }
    const roleNorm = r.toLowerCase().includes('admin') ? 'Admin' : 'Funcionário';
    setSubmitting(true);
    try {
      const res = await authService.register({ username: u, email: em, password, role: roleNorm });
      if (res?.success) {
        setStatus({ type: 'success', message: 'Usuário criado com sucesso.' });
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirm('');
        setRole('Funcionário');
        setAvailability({ usernameAvailable: null, emailAvailable: null });
      } else {
        setStatus({ type: 'danger', message: res?.error || 'Não foi possível criar o usuário.' });
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Erro ao criar usuário.';
      setStatus({ type: 'danger', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setResetStatus({ type: '', message: '' });
    const em = String(resetEmail || '').trim();
    if (!isValidEmail(em)) { setResetStatus({ type: 'danger', message: 'Informe um email válido.' }); return; }
    setResetSubmitting(true);
    try {
      const res = await authService.forgotPassword(em);
      if (res?.success) {
        if (res?.token) {
          setResetStatus({ type: 'success', message: 'Token gerado para testes. Use o link recebido.' });
        } else {
          setResetStatus({ type: 'success', message: 'Se houver usuário correspondente, enviaremos instruções para redefinir a senha.' });
        }
      } else {
        setResetStatus({ type: 'danger', message: res?.error || 'Não foi possível iniciar a recuperação.' });
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Erro ao iniciar recuperação.';
      setResetStatus({ type: 'danger', message: msg });
    } finally {
      setResetSubmitting(false);
    }
  };

  return (
    <div>
      <Navbar />
      <Container className="mt-4">
        <Row className="g-4">
          <Col md={6}>
            <Card>
              <Card.Header>
                <div className="d-flex align-items-center justify-content-between">
                  <span>Criação de Usuário</span>
                  <Badge bg="secondary">Admin</Badge>
                </div>
              </Card.Header>
              <Card.Body>
                {status.message && (<Alert variant={status.type} role="alert">{status.message}</Alert>)}
                <Form onSubmit={handleCreate} noValidate>
                  <Form.Group className="mb-3" controlId="username">
                    <Form.Label>Nome de usuário</Form.Label>
                    <div className="d-flex align-items-center gap-2">
                      <Form.Control value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ex.: joaosilva" aria-required="true" required />
                      {checking && <Spinner animation="border" size="sm" />}
                    </div>
                    {availability.usernameAvailable === false && (
                      <div className="text-danger small mt-1">Nome de usuário indisponível</div>
                    )}
                    {availability.usernameAvailable === true && (
                      <div className="text-success small mt-1">Nome de usuário disponível</div>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seuemail@exemplo.com" aria-required="true" required />
                    {availability.emailAvailable === false && (
                      <div className="text-danger small mt-1">Email já cadastrado</div>
                    )}
                    {availability.emailAvailable === true && (
                      <div className="text-success small mt-1">Email disponível</div>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="password">
                    <Form.Label>Senha</Form.Label>
                    <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" aria-required="true" required />
                    {passwordError && (
                      <div className="text-danger small mt-1">{passwordError}</div>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="confirm">
                    <Form.Label>Confirmar senha</Form.Label>
                    <Form.Control type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-required="true" required />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="role">
                    <Form.Label>Função</Form.Label>
                    <Form.Select value={role} onChange={(e) => setRole(e.target.value)}>
                      <option value="Funcionário">Funcionário</option>
                      <option value="Admin">Admin</option>
                    </Form.Select>
                  </Form.Group>

                  <div className="d-grid">
                    <Button type="submit" variant="primary" disabled={submitting} aria-disabled={submitting}>
                      {submitting ? 'Criando...' : 'Criar usuário'}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card>
              <Card.Header>Redefinição de Senha</Card.Header>
              <Card.Body>
                {resetStatus.message && (<Alert variant={resetStatus.type} role="alert">{resetStatus.message}</Alert>)}
                <Form onSubmit={handleReset} noValidate>
                  <Form.Group className="mb-3" controlId="resetEmail">
                    <Form.Label>Email do usuário</Form.Label>
                    <Form.Control type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="seuemail@exemplo.com" aria-required="true" required />
                  </Form.Group>

                  <div className="d-grid">
                    <Button type="submit" variant="secondary" disabled={resetSubmitting} aria-disabled={resetSubmitting}>
                      {resetSubmitting ? 'Enviando...' : 'Enviar link de redefinição'}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}