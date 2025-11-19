import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { Container, Alert } from 'react-bootstrap';

export default function ValidateEmail() {
  const location = useLocation();
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenRaw = params.get('token') || '';
    const token = decodeURIComponent(String(tokenRaw)).trim();
    async function run() {
      try {
        const { data } = await api.get('/users/validate-email', { params: { token } });
        if (data?.success) {
          setStatus({ type: 'success', message: 'Email validado com sucesso. Você já pode acessar.' });
        } else {
          setStatus({ type: 'error', message: data?.error || 'Falha na validação.' });
        }
      } catch (e) {
        setStatus({ type: 'error', message: e?.response?.data?.error || e.message || 'Erro ao validar.' });
      }
    }
    if (token) run();
    else setStatus({ type: 'error', message: 'Token ausente.' });
  }, [location.search]);

  return (
    <Navbar>
      <div className="content-area full-main">
        <Container className="py-4" style={{ maxWidth: 640 }}>
          <h4 className="mb-3">Validação de Email</h4>
          {status.message && (
            <Alert variant={status.type === 'success' ? 'success' : 'danger'}>{status.message}</Alert>
          )}
        </Container>
      </div>
    </Navbar>
  );
}
/*
  Página Validar Email
  - Confirma endereço de email a partir de token enviado.
*/