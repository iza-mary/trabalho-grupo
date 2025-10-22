import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import PageHeader from '../components/ui/PageHeader';
import StandardTable from '../components/ui/StandardTable';
import financeiroService from '../services/financeiroService';
import { CashStack, Funnel, Pencil, Trash, PlusCircle } from 'react-bootstrap-icons';
import { Button, Col, Form, Row, Spinner, Alert, Card, Badge, Modal } from 'react-bootstrap';
import '../styles/financeiro.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import ActionIconButton from '../components/ui/ActionIconButton';
import { useAuth } from '../hooks/useAuth';

const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0));

const Financeiro = () => {
  const [despesas, setDespesas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [form, setForm] = useState({
    descricao: '',
    valor: '',
    tipo: 'Entrada',
    categoria: '',
    forma_pagamento: '',
    data: '',
    observacao: '',
    recorrente: false,
    frequencia_recorrencia: 'Mensal',
    ocorrencias_recorrencia: 1,
  });
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [despesaParaExcluir, setDespesaParaExcluir] = useState(null);
  const [filter, setFilter] = useState({ tipo: 'todas', category: '', search: '', period: 'all', startDate: '', endDate: '' });

  const { isAdmin } = useAuth();

  const loadDespesas = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await financeiroService.list();
      setDespesas(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Erro ao carregar despesas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDespesas(); }, []);

  const resetForm = () => {
    setForm({ descricao: '', valor: '', tipo: 'Entrada', categoria: '', forma_pagamento: '', data: '', observacao: '', recorrente: false, frequencia_recorrencia: 'Mensal', ocorrencias_recorrencia: 1 });
    setEditId(null);
    setError(null);
    setSuccessMsg(null);
  };

  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleEdit = (d) => {
    setEditId(d.id);
    setForm({
      descricao: d.descricao || '',
      valor: d.valor != null ? String(d.valor) : '',
      tipo: d.tipo || 'Entrada',
      categoria: d.categoria || '',
      forma_pagamento: d.forma_pagamento || '',
      data: d.data || '',
      observacao: d.observacao || '',
      recorrente: !!d.recorrente,
      frequencia_recorrencia: d.frequencia_recorrencia || 'Mensal',
      ocorrencias_recorrencia: d.ocorrencias_recorrencia != null ? String(d.ocorrencias_recorrencia) : '1',
    });
    setShowModal(true);
  };

  const abrirConfirmarExclusao = (d) => {
    setDespesaParaExcluir(d);
    setShowConfirmDelete(true);
  };

  const fecharConfirmarExclusao = () => {
    setShowConfirmDelete(false);
    setDespesaParaExcluir(null);
  };

  const confirmarExclusaoDespesa = async () => {
    if (!despesaParaExcluir) return;
    try {
      setLoading(true);
      await financeiroService.remove(despesaParaExcluir.id);
      setSuccessMsg('Despesa removida com sucesso');
      await loadDespesas();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Erro ao excluir despesa');
    } finally {
      setLoading(false);
      setShowConfirmDelete(false);
      setDespesaParaExcluir(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      // Validações de recorrência no frontend
      if (form.recorrente) {
        const frequenciasValidas = ['Diária','Semanal','Mensal','Bimestral','Trimestral','Semestral','Anual'];
        if (!form.frequencia_recorrencia || !frequenciasValidas.includes(String(form.frequencia_recorrencia))) {
          setError('Selecione uma frequência válida para a recorrência');
          setLoading(false);
          return;
        }
        const ocorr = Number(form.ocorrencias_recorrencia);
        if (!Number.isInteger(ocorr) || ocorr < 1) {
          setError('Ocorrências da recorrência devem ser um inteiro >= 1');
          setLoading(false);
          return;
        }
      }

      const payload = {
        descricao: form.descricao?.trim(),
        valor: Number(form.valor),
        tipo: form.tipo,
        categoria: form.categoria,
        forma_pagamento: form.forma_pagamento,
        data: form.data,
        observacao: form.observacao?.trim() || null,
        recorrente: !!form.recorrente,
        frequencia_recorrencia: form.recorrente ? form.frequencia_recorrencia : null,
        ocorrencias_recorrencia: form.recorrente ? Number(form.ocorrencias_recorrencia) : null,
      };
      if (editId) {
        await financeiroService.update(editId, payload);
        setSuccessMsg('Despesa atualizada com sucesso');
      } else {
        await financeiroService.create(payload);
        setSuccessMsg('Despesa criada com sucesso');
      }
      await loadDespesas();
      resetForm();
      setShowModal(false);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Erro ao salvar despesa');
    } finally {
      setLoading(false);
    }
  };

  const { totalEntradas, totalSaidas, saldoAtual } = useMemo(() => {
    let entradas = 0;
    let saidas = 0;
    for (const d of despesas) {
      const tipo = String(d.tipo || '');
      const valor = Number(d.valor || 0);
      if (tipo === 'Entrada') entradas += valor;
      if (tipo === 'Saída') saidas += valor;
    }
    return { totalEntradas: entradas, totalSaidas: saidas, saldoAtual: entradas - saidas };
  }, [despesas]);

  const visibleDespesas = useMemo(() => {
    const byTipo = (d) => filter.tipo === 'todas' || String(d.tipo) === filter.tipo;
    const bySearch = (d) => {
      const q = String(filter.search || '').toLowerCase();
      if (!q) return true;
      return String(d.descricao || '').toLowerCase().includes(q) || String(d.observacao || '').toLowerCase().includes(q);
    };
    const byCategory = (d) => !filter.category || String(d.categoria) === filter.category;

    const { startDate, endDate } = filter;
    const today = new Date();
    let start = new Date(0);
    let end = new Date('9999-12-31');
    if (filter.period === 'week') {
      const first = new Date(today);
      const day = first.getDay();
      first.setDate(first.getDate() - day + (day === 0 ? -6 : 1));
      start = new Date(first.getFullYear(), first.getMonth(), first.getDate());
      const last = new Date(start);
      last.setDate(start.getDate() + 6);
      end = new Date(last.getFullYear(), last.getMonth(), last.getDate());
    } else if (filter.period === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (filter.period === 'today') {
      start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    } else if (filter.period === 'year') {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
    } else if (filter.period === 'custom') {
      start = startDate ? new Date(startDate) : new Date(0);
      end = endDate ? new Date(endDate) : new Date('9999-12-31');
    }

    const byDate = (d) => {
      if (!d?.data) return true;
      const time = new Date(d.data).getTime();
      return time >= start.getTime() && time <= end.getTime();
    };

    return [...despesas]
      .filter((d) => byTipo(d) && bySearch(d) && byCategory(d) && byDate(d))
      .sort((a, b) => new Date(b.data) - new Date(a.data));
  }, [despesas, filter]);

  return (
    <Navbar>
      <div className="container-fluid py-3 financeiro-page">
        <PageHeader
          title="Financeiro"
          icon={<CashStack />}
          actions={
            <Button variant="primary" onClick={isAdmin ? handleOpenModal : undefined} disabled={!isAdmin || loading} className={`d-inline-flex align-items-center ${!isAdmin ? 'disabled-action' : ''}`}>
              <PlusCircle className="me-1" />
              Nova transação
            </Button>
          }
        />

        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
        {successMsg && <Alert variant="success" className="mb-3">{successMsg}</Alert>}

        {/* Resumo estilizado */}
        <div className="row mb-4">
          <div className="col-md-4 mb-3 mb-md-0">
            <div className="summary-card income-card" role="region" aria-label="Total entradas">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="summary-title">Entrada</div>
                  <small className="summary-sub">Valores creditados</small>
                </div>
                <div className="summary-value">{formatCurrency(totalEntradas)}</div>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3 mb-md-0">
            <div className="summary-card expense-card" role="region" aria-label="Total saídas">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="summary-title">Saída</div>
                  <small className="summary-sub">Valores pagos</small>
                </div>
                <div className="summary-value">{formatCurrency(totalSaidas)}</div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="summary-card balance-card" role="region" aria-label="Saldo atual">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                   <div className="summary-title">Saldo Atual</div>
                 </div>
                <div className="summary-value">{formatCurrency(saldoAtual)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros e Busca (restaurado) */}
        <Card className="mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Filtros e Busca</h5>
            <button
                type="button"
                className="btn-sm btn btn-outline-secondary"
                data-bs-toggle="collapse"
                data-bs-target="#filtrosCollapse"
                title="Mostrar/ocultar filtros"
              >
                <Funnel className="me-1" size={16} />
                Filtros
              </button>
          </Card.Header>
          <Card.Body className="collapse show" id="filtrosCollapse">
            <Row className="g-3 align-items-end">
              <Col md={2}>
                <Form.Group controlId="filterTipo">
                  <Form.Label>Tipo</Form.Label>
                  <Form.Select value={filter.tipo ?? ''} onChange={(e) => setFilter({ ...filter, tipo: e.target.value })}>
                    <option value="todas">Todas</option>
                    <option value="Entrada">Entrada</option>
                    <option value="Saída">Saída</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="filterCategory">
                  <Form.Label>Categoria</Form.Label>
                  <Form.Select value={filter.category ?? ''} onChange={(e) => setFilter({ ...filter, category: e.target.value })}>
                    <option value="">Todas</option>
                    <option value="Doações">Doações</option>
                    <option value="Patrocínios">Patrocínios</option>
                    <option value="Salários">Salários</option>
                    <option value="Fornecedores">Fornecedores</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Outros">Outros</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="filterPeriod">
                  <Form.Label>Período</Form.Label>
                  <Form.Select value={filter.period ?? ''} onChange={(e) => setFilter({ ...filter, period: e.target.value })}>
                    <option value="all">Todos</option>
                    <option value="week">Esta semana</option>
                    <option value="today">Hoje</option>
                    <option value="month">Este mês</option>
                    <option value="year">Este ano</option>
                    <option value="custom">Personalizado</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="filterSearch">
                  <Form.Label>Buscar</Form.Label>
                  <Form.Control type="text" placeholder="Descrição ou observação" value={filter.search ?? ''} onChange={(e) => setFilter({ ...filter, search: e.target.value })} />
                </Form.Group>
              </Col>
              {filter.period === 'custom' && (
                <>
                  <Col md={3}>
                    <Form.Group controlId="filterStart">
                      <Form.Label>De</Form.Label>
                      <Form.Control type="date" value={filter.startDate ?? ''} onChange={(e) => setFilter({ ...filter, startDate: e.target.value })} />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="filterEnd">
                      <Form.Label>Até</Form.Label>
                      <Form.Control type="date" value={filter.endDate ?? ''} onChange={(e) => setFilter({ ...filter, endDate: e.target.value })} />
                    </Form.Group>
                  </Col>
                </>
              )}
            </Row>
          </Card.Body>
        </Card>

        {/* Tabela de despesas */}
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <span>Livro Caixa</span>
            <div className="d-flex gap-2">
              <Button size="sm" variant="outline-secondary" onClick={() => window.print()}>Imprimir</Button>
            </div>
          </Card.Header>
          <Card.Body>
            <StandardTable>
              <thead>
                 <tr>
                   <th>Descrição</th>
                   <th>Tipo</th>
                   <th className="text-end">Valor</th>
                   <th>Categoria</th>
                   <th>Recorrente</th>
                   <th>Ações</th>
                 </tr>
               </thead>
              <tbody>
                 {(visibleDespesas || []).map((d) => (
                   <tr key={d.id} className={String(d.tipo) === 'Entrada' ? 'transaction-income' : 'transaction-expense'}>
                     <td>{d.descricao}</td>
                     <td>
                       <Badge bg={String(d.tipo) === 'Entrada' ? 'success' : 'danger'} className="text-capitalize">{d.tipo}</Badge>
                     </td>
                     <td className="text-end">{formatCurrency(d.valor)}</td>
                     <td>{d.categoria ?? '-'}</td>
                     <td>{d.recorrente ? 'Sim' : 'Não'}</td>
                     <td className="botoes-acao">
                       <ActionIconButton
                          variant="outline-primary"
                          size="sm"
                          title="Editar"
                          ariaLabel={`Editar ${d.descricao}`}
                          disabled={!isAdmin}
                          className={!isAdmin ? 'disabled-action' : ''}
                          onClick={!isAdmin ? undefined : () => handleEdit(d)}
                        >
                          <Pencil />
                        </ActionIconButton>
                       <ActionIconButton
                         variant="outline-danger"
                         size="sm"
                         title="Excluir"
                         ariaLabel={`Excluir ${d.descricao}`}
                         disabled={!isAdmin}
                         className={!isAdmin ? 'disabled-action' : ''}
                         onClick={!isAdmin ? undefined : () => abrirConfirmarExclusao(d)}
                       >
                         <Trash size={16} />
                       </ActionIconButton>
                     </td>
                   </tr>
                 ))}
                 {(!loading && visibleDespesas?.length === 0) && (
                   <tr>
                     <td colSpan={6} className="text-center text-muted py-3">Nenhuma despesa encontrada com os filtros atuais</td>
                   </tr>
                 )}
                 {loading && (
                   <tr>
                     <td colSpan={6} className="text-center py-3"><Spinner animation="border" /></td>
                   </tr>
                 )}
               </tbody>
            </StandardTable>
          </Card.Body>
        </Card>

        {/* Modal para criar/editar despesa */}
        <Modal show={showModal} onHide={handleCloseModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>{editId ? 'Editar Despesa' : 'Nova Despesa'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleSubmit} aria-label={editId ? 'Formulário de edição de despesa' : 'Formulário de criação de despesa'}>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Group controlId="tipo">
                    <Form.Label>Tipo</Form.Label>
                    <Form.Select value={form.tipo ?? ''} onChange={(e) => setForm({ ...form, tipo: e.target.value })} required>
                      <option value="Entrada">Entrada</option>
                      <option value="Saída">Saída</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="data">
                    <Form.Label>Data</Form.Label>
                    <Form.Control type="date" value={form.data ?? ''} onChange={(e) => setForm({ ...form, data: e.target.value })} required />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="valor">
                    <Form.Label>Valor</Form.Label>
                    <Form.Control type="number" step="0.01" min="0" value={form.valor ?? ''} onChange={(e) => setForm({ ...form, valor: e.target.value })} required />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="categoria">
                    <Form.Label>Categoria</Form.Label>
                    <Form.Select value={form.categoria ?? ''} onChange={(e) => setForm({ ...form, categoria: e.target.value })} required>
                      <option value="">Selecione</option>
                      <option value="Doações">Doações</option>
                      <option value="Patrocínios">Patrocínios</option>
                      <option value="Salários">Salários</option>
                      <option value="Fornecedores">Fornecedores</option>
                      <option value="Manutenção">Manutenção</option>
                      <option value="Outros">Outros</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="forma_pagamento">
                    <Form.Label>Forma de Pagamento</Form.Label>
                    <Form.Select value={form.forma_pagamento ?? ''} onChange={(e) => setForm({ ...form, forma_pagamento: e.target.value })} required>
                      <option value="">Selecione</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="PIX">PIX</option>
                      <option value="Transferência Bancária">Transferência Bancária</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Cheque">Cheque</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="descricao">
                    <Form.Label>Descrição</Form.Label>
                    <Form.Control type="text" value={form.descricao ?? ''} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="observacao">
                    <Form.Label>Observação</Form.Label>
                    <Form.Control as="textarea" rows={2} value={form.observacao ?? ''} onChange={(e) => setForm({ ...form, observacao: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Check
                    type="switch"
                    id="recorrente"
                    label="Cobrança recorrente"
                    checked={!!form.recorrente}
                    onChange={(e) => setForm({
                      ...form,
                      recorrente: e.target.checked,
                      frequencia_recorrencia: e.target.checked ? (form.frequencia_recorrencia || 'Mensal') : '',
                      ocorrencias_recorrencia: e.target.checked ? (form.ocorrencias_recorrencia || 1) : '',
                    })}
                  />
                </Col>
                {form.recorrente && (
                  <>
                    <Col md={6}>
                      <Form.Group controlId="frequencia_recorrencia">
                        <Form.Label>Frequência</Form.Label>
                        <Form.Select value={form.frequencia_recorrencia ?? ''} onChange={(e) => setForm({ ...form, frequencia_recorrencia: e.target.value })} required>
                          <option value="Diária">Diária</option>
                          <option value="Semanal">Semanal</option>
                          <option value="Mensal">Mensal</option>
                          <option value="Bimestral">Bimestral</option>
                          <option value="Trimestral">Trimestral</option>
                          <option value="Semestral">Semestral</option>
                          <option value="Anual">Anual</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="ocorrencias_recorrencia">
                        <Form.Label>Ocorrências</Form.Label>
                        <Form.Control type="number" min="1" step="1" value={form.ocorrencias_recorrencia ?? ''} onChange={(e) => setForm({ ...form, ocorrencias_recorrencia: e.target.value })} required />
                      </Form.Group>
                    </Col>
                  </>
                )}
              </Row>
              <div className="mt-3 d-flex gap-2">
                <Button type="submit" variant="primary" disabled={!isAdmin || loading}>
                  {loading ? (<><Spinner animation="border" size="sm" className="me-2" /> Salvando...</>) : (editId ? 'Atualizar' : 'Salvar')}
                </Button>
                <Button type="button" variant="outline-secondary" onClick={handleCloseModal} disabled={loading}>Cancelar</Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        <Modal show={showConfirmDelete} onHide={fecharConfirmarExclusao} aria-labelledby="confirm-delete-title" aria-describedby="confirm-delete-desc">
          <Modal.Header closeButton>
            <Modal.Title id="confirm-delete-title">Confirmar Exclusão</Modal.Title>
          </Modal.Header>
          <Modal.Body id="confirm-delete-desc">
            Tem certeza que deseja excluir esta transação? Esta ação não poderá ser desfeita.
            {despesaParaExcluir?.descricao && (
              <div className="mt-2">
                <strong>{despesaParaExcluir.descricao}</strong>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={fecharConfirmarExclusao} disabled={loading}>Cancelar</Button>
            <Button variant="danger" onClick={isAdmin ? confirmarExclusaoDespesa : undefined} disabled={!isAdmin || loading}>Excluir</Button>
          </Modal.Footer>
        </Modal>
      </div>
    </Navbar>
  );
};

export default Financeiro;