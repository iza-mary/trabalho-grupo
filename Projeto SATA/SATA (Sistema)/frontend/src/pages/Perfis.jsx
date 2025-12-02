/*
  Página Perfis (Admin)
  - Gerencia usuários do sistema: listagem, filtros, criação/edição, status, reset e exclusão.
  - Inclui proteções contra repetição de submissão, limite de tentativas e validações de formulário.
*/
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, InputGroup, Alert, Modal, Spinner } from 'react-bootstrap';
import { People, Pencil, Trash, ShieldLock, Eye, EyeSlash } from 'react-bootstrap-icons';
import Navbar from '../components/Navbar';
import PageHeader from '../components/ui/PageHeader';
import HelpButton from '../components/ui/HelpButton';
import StandardTable from '../components/ui/StandardTable';
import ActionIconButton from '../components/ui/ActionIconButton';
import StatusBadge from '../components/ui/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import authService from '../services/authService';

export default function Perfis() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [statusFilter, setStatusFilter] = useState('todos');
  const [roleFilter, setRoleFilter] = useState('todas');
  const [termoBusca, setTermoBusca] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [sortBy, setSortBy] = useState('username');
  const [sortDir, setSortDir] = useState('asc');
  const [visibleCount, setVisibleCount] = useState(50);

  const [mostrarModalEdicao, setMostrarModalEdicao] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', role: 'Funcionário', password: '', confirm: '' });
  const [passwordErr, setPasswordErr] = useState('');
  const [confirmErr, setConfirmErr] = useState('');
  const [salvarDisabledUntil, setSalvarDisabledUntil] = useState(0);
  const [janelaInicio, setJanelaInicio] = useState(0);
  const [tentativas, setTentativas] = useState(0);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [usuarioExcluir, setUsuarioExcluir] = useState(null);
  const [mostrarModalReset, setMostrarModalReset] = useState(false);
  const [resetStatus, setResetStatus] = useState('idle');
  const [resetMsg, setResetMsg] = useState('');

  // Busca inicial e sempre que filtros mudarem
  const carregar = useCallback(async () => {
    setCarregando(true); setErro(''); setSucesso('');
    try {
      const params = {
        page: 1,
        pageSize: 10000,
      };
      if (statusFilter !== 'todos') params.status = statusFilter;
      if (roleFilter !== 'todas') params.role = roleFilter;
      if (termoBusca.trim()) params.search = termoBusca.trim();
      const res = await authService.listUsers(params);
      if (res?.success) {
        setRows(res.data?.items || []);
      } else {
        setErro(res?.error || 'Falha ao carregar perfis');
      }
    } catch (e) {
      setErro(e?.response?.data?.error || e.message || 'Erro ao carregar perfis');
    } finally {
      setCarregando(false);
    }
  }, [statusFilter, roleFilter, termoBusca]);

  useEffect(() => { carregar(); }, [carregar]);

  // Abre modal de criação com estado inicial
  const abrirCriacao = () => { setUsuarioEditar(null); setForm({ username: '', email: '', role: 'Funcionário', password: '', confirm: '' }); setPasswordErr(''); setConfirmErr(''); setShowPw(false); setShowConfirm(false); setMostrarModalEdicao(true); };
  const abrirEdicao = (row) => { setUsuarioEditar(row); setForm({ username: row.username, email: row.email, role: row.role }); setMostrarModalEdicao(true); };
  const fecharModalEdicao = () => setMostrarModalEdicao(false);

  // Valida campos do formulário; aplica regras de senha em criação
  const validarForm = () => {
    const u = String(form.username || '').trim();
    const em = String(form.email || '').trim();
    if (!u || u.length < 3) return 'Informe um nome de usuário válido';
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(em)) return 'Informe um email válido';
    if (!usuarioEditar) {
      const p = String(form.password || '');
      const c = String(form.confirm || '');
      const hasNum = /\d/.test(p);
      if (p.length < 8 || !hasNum) {
        setPasswordErr('A senha deve ter ao menos 8 caracteres e 1 número');
        return 'Senha inválida';
      } else { setPasswordErr(''); }
      if (p !== c) {
        setConfirmErr('As senhas não coincidem');
        return 'Confirmação não coincide';
      } else { setConfirmErr(''); }
    }
    return null;
  };

  // Salva criação/edição, com cooldown anti-spam e janela de tentativas
  const salvar = async () => {
    const now = Date.now();
    if (now < salvarDisabledUntil) { setErro('Aguarde alguns segundos antes de enviar novamente.'); return; }
    if (!janelaInicio || (now - janelaInicio) > 60_000) { setJanelaInicio(now); setTentativas(0); }
    if (tentativas >= 5) { setErro('Limite de tentativas atingido. Aguarde 1 minuto para tentar novamente.'); return; }
    setTentativas((x) => x + 1);
    const err = validarForm(); if (err) { setErro(err); return; }
    setErro(''); setSucesso('');
    try {
      if (!usuarioEditar) {
        const payload = { username: form.username, email: form.email, role: form.role, password: form.password };
        const res = await authService.adminCreateUser(payload);
        if (res?.success) { setSucesso('Perfil criado'); setMostrarModalEdicao(false); carregar(); } else { setErro(res?.error || 'Falha ao criar'); }
      } else {
        const res = await authService.adminUpdateUser(usuarioEditar.id, form);
        if (res?.success) { setSucesso('Perfil atualizado'); setMostrarModalEdicao(false); carregar(); } else { setErro(res?.error || 'Falha ao atualizar'); }
      }
    } catch (e) {
      setErro(e?.response?.data?.error || e.message || 'Erro na operação');
    } finally {
      setSalvarDisabledUntil(Date.now() + 3000);
    }
  };

  // Alterna status ativo/inativo para o perfil
  // Removido: alternância de status (ativar/inativar)

  const confirmarExcluir = (row) => setUsuarioExcluir(row);
  const cancelarExcluir = () => setUsuarioExcluir(null);
  // Executa exclusão após confirmação
  const executarExcluir = async () => {
    if (!usuarioExcluir) return;
    try {
      const res = await authService.adminDeleteUser(usuarioExcluir.id);
      if (res?.success) { setSucesso('Perfil excluído'); setUsuarioExcluir(null); carregar(); }
      else { setErro(res?.error || 'Falha ao excluir'); }
    } catch (e) { setErro(e?.response?.data?.error || e.message || 'Erro ao excluir'); }
  };

  // Dispara fluxo de recuperação de senha via email
  const resetarSenha = async (row) => {
    try {
      const em = String(row.email || '').trim();
      if (!em) { setResetStatus('error'); setResetMsg('Usuário não possui email cadastrado. Edite o perfil e informe um email.'); return; }
      const res = await authService.forgotPassword(em);
      if (res?.success) { setResetStatus('success'); setResetMsg(`Enviamos um link de redefinição para ${em}.`); }
      else { setResetStatus('error'); setResetMsg(res?.error || 'Falha ao iniciar redefinição'); }
    } catch (e) { setResetStatus('error'); setResetMsg(e?.response?.data?.error || e.message || 'Erro ao iniciar redefinição'); }
  };

  // Abre modal de envio e executa solicitação
  const abrirResetModal = (row) => {
    setMostrarModalReset(true);
    setResetStatus('sending');
    setResetMsg('Enviando link de redefinição...');
    resetarSenha(row);
  };

  

  if (!isAdmin) {
    return (
      <Navbar>
        <div className="content-area full-main">
          <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <Alert variant="warning">Acesso negado - Esta funcionalidade é exclusiva para administradores</Alert>
          </Container>
        </div>
      </Navbar>
    );
  }

  const rowsVisiveis = rows.filter((r) => String(r.username).toLowerCase() !== 's4tadmin');
  const normalize = (v) => (v == null ? '' : String(v).toLowerCase());
  const sortedRows = [...rowsVisiveis].sort((a, b) => {
    const dir = sortDir === 'desc' ? -1 : 1;
    switch (sortBy) {
      case 'username': return normalize(a.username) > normalize(b.username) ? dir : -dir;
      case 'email': return normalize(a.email) > normalize(b.email) ? dir : -dir;
      case 'role': return normalize(a.role) > normalize(b.role) ? dir : -dir;
      case 'created_at': return (new Date(a.created_at || 0) - new Date(b.created_at || 0)) * dir;
      case 'status': return normalize(a.status) > normalize(b.status) ? dir : -dir;
      default: return 0;
    }
  });
  const displayRows = sortedRows.slice(0, visibleCount);
  const onScrollLoadMore = (e) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
      setVisibleCount((c) => Math.min(c + 50, sortedRows.length));
    }
  };
  const toggleSort = (field) => {
    setSortDir((prev) => (sortBy === field ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'));
    setSortBy(field);
  };

  return (
    <Navbar>
      <div className="content-area full-main">
        <Container fluid>
          <PageHeader
            title="Gerenciamento de Perfis"
            icon={<People />}
            suffix={<HelpButton inline iconOnly />}
            actions={(
              <div className="d-flex gap-2">
                <Button variant="outline-secondary" onClick={() => navigate('/change-password')} className="d-inline-flex align-items-center">
                  <ShieldLock className="me-1" /> Mudar minha senha
                </Button>
                <Button variant="primary" onClick={abrirCriacao}>
                  Novo Perfil
                </Button>
              </div>
            )}
          />

          {erro && (
            <Alert variant="danger" role="alert">{erro}</Alert>
          )}
          {sucesso && (
            <Alert variant="success" role="alert">{sucesso}</Alert>
          )}

          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Filtros e Busca</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); }}>
                    <option value="todos">Todos</option>
                    <option value="ativo">Ativos</option>
                    <option value="inativo">Inativos</option>
                  </Form.Select>
                </Col>
                <Col md={3} className="mb-3">
                  <Form.Label>Permissão</Form.Label>
                  <Form.Select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); }}>
                    <option value="todas">Todas</option>
                    <option value="Admin">Admin</option>
                    <option value="Funcionário">Funcionário</option>
                  </Form.Select>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Label>Buscar</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      value={termoBusca}
                      onChange={(e) => { setTermoBusca(e.target.value); }}
                      placeholder="Buscar..."
                      aria-label="Buscar usuários"
                    />
                  </InputGroup>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              {carregando ? (
                <Alert variant="info">Carregando...</Alert>
              ) : rowsVisiveis.length === 0 ? (
                <Alert variant="warning">Nenhum perfil encontrado com os filtros atuais.</Alert>
              ) : (
                <div className="table-responsive" style={{ maxHeight: '60vh', overflowY: 'auto' }} onScroll={onScrollLoadMore}>
                  <StandardTable>
                    <thead>
                      <tr>
                        <th role="button" onClick={() => toggleSort('username')}>Nome</th>
                        <th role="button" onClick={() => toggleSort('email')}>E-mail</th>
                        <th role="button" onClick={() => toggleSort('role')}>Nível de acesso</th>
                        <th role="button" onClick={() => toggleSort('created_at')}>Data de criação</th>
                        <th role="button" onClick={() => toggleSort('status')}>Status</th>
                        <th className="text-end">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayRows.map((r) => (
                        <tr key={r.id}>
                          <td>{r.username}</td>
                          <td>{r.email}</td>
                          <td>{r.role}</td>
                          <td>{r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</td>
                          <td><StatusBadge status={r.status || 'ativo'} /></td>
                          <td className="text-end botoes-acao">
                            <ActionIconButton variant="outline-primary" title="Editar" onClick={() => abrirEdicao(r)}>
                              <Pencil />
                            </ActionIconButton>
                            {/* Botão de ativar/inativar removido conforme solicitação */}
                            <ActionIconButton variant="outline-secondary" title="Reset senha" onClick={() => abrirResetModal(r)}>
                              <ShieldLock />
                            </ActionIconButton>
                            
                            <ActionIconButton variant="outline-danger" title="Excluir" onClick={() => confirmarExcluir(r)}>
                              <Trash />
                            </ActionIconButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </StandardTable>
                </div>
              )}


            </Card.Body>
          </Card>

          <Modal show={mostrarModalEdicao} onHide={fecharModalEdicao} centered>
            <Modal.Header closeButton>
              <Modal.Title>{usuarioEditar ? 'Editar Perfil' : 'Novo Perfil'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form noValidate>
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label>Nome de usuário</Form.Label>
                  <Form.Control type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                </Form.Group>
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </Form.Group>
                <Form.Group className="mb-3" controlId="role">
                  <Form.Label>Permissão</Form.Label>
                  <Form.Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="Funcionário">Funcionário</option>
                    <option value="Admin">Admin</option>
                  </Form.Select>
                </Form.Group>
                {!usuarioEditar && (
                  <>
                    <Form.Group className="mb-3" controlId="password">
                      <Form.Label>Senha</Form.Label>
                      <InputGroup>
                        <Form.Control type={showPw ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} isInvalid={!!passwordErr} required />
                        <Button variant="outline-secondary" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}>
                          {showPw ? <EyeSlash /> : <Eye />}
                        </Button>
                      </InputGroup>
                      {passwordErr && <Form.Control.Feedback type="invalid">{passwordErr}</Form.Control.Feedback>}
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="confirm">
                      <Form.Label>Confirmação de senha</Form.Label>
                      <InputGroup>
                        <Form.Control type={showConfirm ? 'text' : 'password'} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} isInvalid={!!confirmErr} required />
                        <Button variant="outline-secondary" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? 'Ocultar confirmação' : 'Mostrar confirmação'}>
                          {showConfirm ? <EyeSlash /> : <Eye />}
                        </Button>
                      </InputGroup>
                      {confirmErr && <Form.Control.Feedback type="invalid">{confirmErr}</Form.Control.Feedback>}
                    </Form.Group>
                    <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                      Após salvar, enviaremos um email com um link de confirmação válido por 24 horas. O perfil será ativado após a confirmação.
                    </div>
                  </>
                )}
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={fecharModalEdicao}>Cancelar</Button>
              <Button variant="primary" onClick={salvar}>Salvar</Button>
            </Modal.Footer>
          </Modal>

          <Modal show={mostrarModalReset} onHide={() => setMostrarModalReset(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Envio de email</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {resetStatus === 'sending' && (
                <div className="d-flex align-items-center gap-3">
                  <Spinner animation="border" size="sm" />
                  <span>{resetMsg}</span>
                </div>
              )}
              {resetStatus === 'success' && (
                <Alert variant="success" className="mb-0">{resetMsg}</Alert>
              )}
              {resetStatus === 'error' && (
                <Alert variant="danger" className="mb-0">{resetMsg}</Alert>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="primary" onClick={() => setMostrarModalReset(false)}>Fechar</Button>
            </Modal.Footer>
          </Modal>

          <Modal show={!!usuarioExcluir} onHide={cancelarExcluir} centered>
            <Modal.Header closeButton>
              <Modal.Title>Confirmar exclusão</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              Tem certeza que deseja excluir o perfil {usuarioExcluir?.username}?
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={cancelarExcluir}>Cancelar</Button>
              <Button variant="danger" onClick={executarExcluir}>Excluir</Button>
            </Modal.Footer>
          </Modal>
        </Container>
      </div>
    </Navbar>
  );
}
