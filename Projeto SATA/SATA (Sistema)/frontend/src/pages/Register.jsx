import { useState, useMemo } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PasswordField from '../components/ui/PasswordField';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function passwordStrength(pw) {
  const length = pw.length >= 8 ? 1 : 0;
  const lower = /[a-z]/.test(pw) ? 1 : 0;
  const number = /\d/.test(pw) ? 1 : 0;
  // Não exigir maiúsculas ou símbolos; ainda considerar como bônus
  const upper = /[A-Z]/.test(pw) ? 1 : 0;
  const special = /[^A-Za-z0-9]/.test(pw) ? 1 : 0;
  const score = length + lower + number + upper + special;
  const levels = ['Muito fraca', 'Fraca', 'Média', 'Forte', 'Muito forte'];
  return { score, label: levels[Math.max(0, score - 1)] };
}

function isAcceptablePassword(pw) {
  if (!pw || pw.length < 8) return false;
  const lower = pw.toLowerCase();
  const common = ['12345678','123456789','password','qwerty','abc123','111111','123123','senha','admin'];
  if (common.includes(lower)) return false;
  if (/^(.)\1{7,}$/.test(pw)) return false; // repetição
  if (lower.includes('abcdefghijklmnopqrstuvwxyz') || lower.includes('12345678')) return false; // sequências triviais
  return true;
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Funcionário');
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);

  const validateRealtime = () => {
    const e = {};
    if (!username.trim()) e.username = 'Nome é obrigatório';
    if (!email.trim() || !validateEmail(email)) e.email = 'Email inválido';
    if (!password || password.length < 8) e.password = 'Senha deve ter pelo menos 8 caracteres';
    if (password && !isAcceptablePassword(password)) {
      e.password = (e.password ? e.password + '; ' : '') + 'Evite senhas comuns ou muito simples (ex.: 12345678, password).';
    }
    if (confirmPassword !== password) e.confirmPassword = 'Confirmação não confere';
    if (!['Admin', 'Funcionário'].includes(role)) e.role = 'Tipo de permissão inválido';
    setErrors(e);
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    const e2 = validateRealtime();
    if (Object.keys(e2).length) return;

    setSubmitting(true);
    const res = await register({ username: username.trim(), email: email.trim(), password, role });
    setSubmitting(false);

    if (res.ok) {
      setStatus({ type: 'success', message: 'Cadastro realizado com sucesso! Você já pode fazer login.' });
      setTimeout(() => navigate('/login'), 1500);
    } else {
      setStatus({ type: 'danger', message: res.error || 'Falha no cadastro' });
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <h1 className="mb-4">Criar conta</h1>
          {status.message && (
            <Alert variant={status.type} role="alert">{status.message}</Alert>
          )}
          <Form onSubmit={handleSubmit} noValidate>
            <Form.Group className="mb-3" controlId="username">
              <Form.Label>Nome</Form.Label>
              <Form.Control
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); validateRealtime(); }}
                placeholder="Seu nome"
                required
                aria-required="true"
                isInvalid={!!errors.username}
              />
              <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); validateRealtime(); }}
                placeholder="seuemail@exemplo.com"
                autoComplete="email"
                required
                aria-required="true"
                isInvalid={!!errors.email}
              />
              <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
            </Form.Group>

            <PasswordField
              id="password"
              label="Senha"
              value={password}
              onChange={(e) => { setPassword(e.target.value); validateRealtime(); }}
              placeholder="Crie uma senha forte"
              autoComplete="new-password"
              required={true}
              ariaRequired={true}
              isInvalid={!!errors.password}
              feedback={errors.password}
            />

            <div className="mb-2" aria-live="polite">Força da senha: {strength.label}</div>

            <PasswordField
              id="confirmPassword"
              label="Confirmar senha"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); validateRealtime(); }}
              placeholder="Repita a senha"
              autoComplete="new-password"
              required={true}
              ariaRequired={true}
              isInvalid={!!errors.confirmPassword}
              feedback={errors.confirmPassword}
            />

            <Form.Group className="mb-3" controlId="role">
              <Form.Label>Tipo de permissão</Form.Label>
              <Form.Select value={role} onChange={(e) => { setRole(e.target.value); validateRealtime(); }}>
                <option value="Funcionário">Funcionário</option>
                <option value="Admin">Admin</option>
              </Form.Select>
              {errors.role && <div className="invalid-feedback d-block">{errors.role}</div>}
            </Form.Group>

            <div className="d-grid gap-2">
              <Button type="submit" variant="primary" disabled={submitting} aria-disabled={submitting}>
                {submitting ? 'Criando...' : 'Criar conta'}
              </Button>
              <div className="text-center">
                <Link to="/login">Já tenho uma conta</Link>
              </div>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
/*
  Página Registro
  - Cria contas de usuário com validações de formulário.
*/