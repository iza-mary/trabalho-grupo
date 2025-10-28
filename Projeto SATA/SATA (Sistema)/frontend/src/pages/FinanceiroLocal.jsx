import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import PageHeader from '../components/ui/PageHeader';
import StandardTable from '../components/ui/StandardTable';
import { CashStack, Funnel, PlusCircle } from 'react-bootstrap-icons';
import { Button, Col, Form, Row, Spinner, Alert, Card, Badge, Modal } from 'react-bootstrap';
import '../styles/financeiro.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { useDialog } from '../context/useDialog';

const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0));
const formatDate = (d) => {
  if (!d) return '-';
  try {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return d;
    return date.toLocaleDateString('pt-BR');
  } catch {
    return d;
  }
};

const STORAGE_KEY = 'financeiro_local_transacoes';

const FinanceiroLocal = () => {
  const { confirm } = useDialog();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [form, setForm] = useState({
    tipo: 'entrada',
    data: '',
    descricao: '',
    categoria: '',
    formaPagamento: '',
    valor: '',
    observacao: '',
    recorrente: false,
    frequencia: 'mensal',
    fimRecorrencia: ''
  });
  const [editId, setEditId] = useState(null);

  const [filter, setFilter] = useState({ tipo: 'todas', search: '', period: 'all', category: '', startDate: '', endDate: '' });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setTransactions(parsed);
    } catch (e) {
      console.warn('Falha ao carregar dados locais:', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.warn('Falha ao salvar dados locais:', e);
    }
  }, [transactions]);

  const resetForm = () => {
    setForm({ tipo: 'entrada', data: '', descricao: '', categoria: '', formaPagamento: '', valor: '', observacao: '', recorrente: false, frequencia: 'mensal', fimRecorrencia: '' });
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload = {
        id: editId ?? crypto.randomUUID(),
        tipo: form.tipo,
        data: form.data,
        descricao: form.descricao?.trim(),
        categoria: form.categoria?.trim() || null,
        formaPagamento: form.formaPagamento?.trim() || null,
        valor: Number(form.valor),
        observacao: form.observacao?.trim() || null,
        recorrente: !!form.recorrente,
        frequencia: form.frequencia || null,
        fimRecorrencia: form.fimRecorrencia || null,
      };

      if (!payload.descricao || !payload.data || Number.isNaN(payload.valor)) {
        throw new Error('Preencha descrição, data e valor corretamente.');
      }

      if (editId) {
        setTransactions((prev) => prev.map((t) => (t.id === editId ? { ...t, ...payload } : t)));
        setSuccessMsg('Transação atualizada com sucesso');
      } else {
        setTransactions((prev) => [{ ...payload }, ...prev]);
        setSuccessMsg('Transação adicionada com sucesso');
      }

      resetForm();
      setShowModal(false);
    } catch (err) {
      setError(err?.message || 'Erro ao salvar transação');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (t) => {
    setEditId(t.id);
    setForm({
      tipo: t.tipo || 'entrada',
      data: t.data || '',
      descricao: t.descricao || '',
      categoria: t.categoria || '',
      formaPagamento: t.formaPagamento || '',
      valor: t.valor != null ? String(t.valor) : '',
      observacao: t.observacao || '',
      recorrente: !!t.recorrente,
      frequencia: t.frequencia || 'mensal',
      fimRecorrencia: t.fimRecorrencia || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const ok = await confirm('Tem certeza que deseja excluir esta transação?');
    if (!ok) return;
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setSuccessMsg('Transação removida com sucesso');
  };

  const visibleTransactions = useMemo(() => {
    const byTipo = (t) => filter.tipo === 'todas' || t.tipo === filter.tipo;
    const bySearch = (t) => !filter.search || (t.descricao || '').toLowerCase().includes(filter.search.toLowerCase());
    const byCategory = (t) => !filter.category || (t.categoria || '') === filter.category;

    const now = new Date();
    const { start, end } = (() => {
      switch (filter.period) {
        case 'all': {
          // Sem filtro de data: incluir todos os itens
          const start = new Date(0);
          const end = new Date(8640000000000000); // Max Date
          return { start, end };
        }
        case 'week': {
          // Início da semana atual (segunda-feira como primeiro dia)
          const day = now.getDay();
          const diffToMonday = (day === 0 ? -6 : 1) - day; // se domingo(0), voltar 6 dias
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
          const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59, 999);
          return { start, end };
        }
        case 'today': {
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          return { start, end };
        }
        case 'month': {
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          return { start, end };
        }
        case 'year': {
          const start = new Date(now.getFullYear(), 0, 1);
          const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
          return { start, end };
        }
        case 'custom': {
          const start = filter.startDate ? new Date(filter.startDate) : new Date(0);
          const end = filter.endDate ? new Date(filter.endDate) : now;
          return { start, end };
        }
        default:
          return { start: new Date(0), end: now };
      }
    })();

    const byDate = (t) => {
      const time = new Date(t.data).getTime();
      return time >= start.getTime() && time <= end.getTime();
    };

    return [...transactions]
      .filter((t) => byTipo(t) && bySearch(t) && byCategory(t) && byDate(t))
      .sort((a, b) => new Date(b.data) - new Date(a.data));
  }, [transactions, filter]);

  const { totalEntradas, totalSaidas, saldoAtual } = useMemo(() => {
    const entradas = transactions.filter((t) => t.tipo === 'entrada').reduce((acc, t) => acc + Number(t.valor || 0), 0);
    const saidas = transactions.filter((t) => t.tipo === 'saida').reduce((acc, t) => acc + Number(t.valor || 0), 0);
    return { totalEntradas: entradas, totalSaidas: saidas, saldoAtual: entradas - saidas };
  }, [transactions]);

  const handleExportCSV = () => {
    const headers = ['Data', 'Descrição', 'Tipo', 'Valor', 'Categoria', 'Forma de Pagamento', 'Observação'];
    const rows = visibleTransactions.map(t => [
      formatDate(t.data),
      (t.descricao || '').replace(/"/g, '""'),
      t.tipo,
      String(t.valor).replace('.', ','),
      t.categoria || '',
      t.formaPagamento || '',
      (t.observacao || '').replace(/"/g, '""')
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transacoes_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Navbar disableSidebar={showModal}>
      <div className="container-fluid py-3 financeiro-page">
        <PageHeader
          title="Financeiro"
          icon={<CashStack />}
          actions={
            <Button variant="primary" onClick={handleOpenModal} disabled={loading}>
              <PlusCircle className="me-1" size={16} />
              Nova transação
            </Button>
          }
        />

        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
        {successMsg && <Alert variant="success" className="mb-3">{successMsg}</Alert>}

        {/* Resumo - cards com estilo */}
        <div className="row mb-4">
          <div className="col-md-4 mb-3 mb-md-0">
            <div className="summary-card income-card" role="region" aria-label="Total de entradas">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="summary-title">Total de entradas</div>
                  <small className="summary-sub">Valores recebidos</small>
                </div>
                <div className="summary-value">{formatCurrency(totalEntradas)}</div>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3 mb-md-0">
            <div className="summary-card expense-card" role="region" aria-label="Total de saídas">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="summary-title">Total de saídas</div>
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
                  <div className="summary-title">Saldo atual</div>
                  <small className="summary-sub">Entradas - Saídas</small>
                </div>
                <div className="summary-value">{formatCurrency(saldoAtual)}</div>
              </div>
            </div>
          </div>
        </div>

        <Modal show={showModal} onHide={handleCloseModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>{editId ? 'Editar Transação' : 'Nova Transação'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleSubmit}>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Group controlId="tipo">
                    <Form.Label>Tipo</Form.Label>
                    <Form.Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} required>
                      <option value="entrada">Entrada</option>
                      <option value="saida">Saída</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="data">
                    <Form.Label>Data</Form.Label>
                    <Form.Control type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="valor">
                    <Form.Label>Valor</Form.Label>
                    <Form.Control type="number" step="0.01" min="0" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} required />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="descricao">
                    <Form.Label>Descrição</Form.Label>
                    <Form.Control type="text" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="categoria">
                    <Form.Label>Categoria</Form.Label>
                    <Form.Select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
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
                  <Form.Group controlId="formaPagamento">
                    <Form.Label>Forma de Pagamento</Form.Label>
                    <Form.Select value={form.formaPagamento} onChange={(e) => setForm({ ...form, formaPagamento: e.target.value })}>
                      <option value="">Selecione</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Cartão">Cartão</option>
                      <option value="Transferência">Transferência</option>
                      <option value="Boleto">Boleto</option>
                      <option value="PIX">PIX</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="observacao">
                    <Form.Label>Observação</Form.Label>
                    <Form.Control as="textarea" rows={2} value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Check
                    type="switch"
                    id="recorrente"
                    label="Transação recorrente"
                    checked={!!form.recorrente}
                    onChange={(e) => setForm({ ...form, recorrente: e.target.checked })}
                  />
                </Col>
                {form.recorrente && (
                  <>
                    <Col md={6}>
                      <Form.Group controlId="frequencia">
                        <Form.Label>Frequência</Form.Label>
                        <Form.Select value={form.frequencia} onChange={(e) => setForm({ ...form, frequencia: e.target.value })}>
                          <option value="semanal">Semanal</option>
                          <option value="mensal">Mensal</option>
                          <option value="anual">Anual</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="fimRecorrencia">
                        <Form.Label>Fim</Form.Label>
                        <Form.Control type="date" value={form.fimRecorrencia} onChange={(e) => setForm({ ...form, fimRecorrencia: e.target.value })} />
                      </Form.Group>
                    </Col>
                  </>
                )}
              </Row>
              <div className="mt-3 d-flex gap-2">
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? (<><Spinner animation="border" size="sm" className="me-2" /> Salvando...</>) : (editId ? 'Atualizar' : 'Salvar')}
                </Button>
                <Button type="button" variant="outline-secondary" onClick={handleCloseModal} disabled={loading}>
                  Cancelar
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

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
              Filtros e Busca
            </button>
          </Card.Header>
          <Card.Body className="collapse show" id="filtrosCollapse">
            <Row className="g-3 align-items-end">
                <Col md={2}>
                  <Form.Group controlId="filterTipo">
                    <Form.Label>Tipo</Form.Label>
                    <Form.Select value={filter.tipo} onChange={(e) => setFilter({ ...filter, tipo: e.target.value })}>
                      <option value="todas">Todas</option>
                      <option value="entrada">Entradas</option>
                      <option value="saida">Saídas</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group controlId="filterPeriod">
                    <Form.Label>Período</Form.Label>
                    <Form.Select value={filter.period} onChange={(e) => setFilter({ ...filter, period: e.target.value })}>
+                         <option value="all">Todos</option>
+                         <option value="week">Esta semana</option>
                          <option value="today">Hoje</option>
                          <option value="month">Este mês</option>
+                         <option value="year">Este ano</option>
                          <option value="custom">Personalizado</option>
                        </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group controlId="filterCategory">
                    <Form.Label>Categoria</Form.Label>
                    <Form.Select value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value })}>
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
                <Col md={4}>
                  <Form.Group controlId="filterSearch">
                    <Form.Label>Buscar</Form.Label>
                    <Form.Control type="text" placeholder="Descrição" value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })} />
                  </Form.Group>
                </Col>
                {filter.period === 'custom' && (
                  <>
                    <Col md={3}>
                      <Form.Group controlId="filterStart">
                        <Form.Label>De</Form.Label>
                        <Form.Control type="date" value={filter.startDate} onChange={(e) => setFilter({ ...filter, startDate: e.target.value })} />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group controlId="filterEnd">
                        <Form.Label>Até</Form.Label>
                        <Form.Control type="date" value={filter.endDate} onChange={(e) => setFilter({ ...filter, endDate: e.target.value })} />
                      </Form.Group>
                    </Col>
                  </>
                )}
              </Row>
            </Card.Body>
        </Card>

        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <span>Transações</span>
            <div className="d-flex gap-2">
              <Button size="sm" variant="outline-secondary" onClick={handleExportCSV}>Exportar CSV</Button>
              <Button size="sm" variant="outline-secondary" onClick={handlePrint}>Imprimir</Button>
            </div>
          </Card.Header>
          <Card.Body>
            {visibleTransactions.length === 0 ? (
               <Alert variant="warning">
                 Nenhuma transação encontrada com os filtros atuais.
               </Alert>
             ) : (
              <StandardTable>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Tipo</th>
                    <th className="text-end">Valor</th>
                    <th>Categoria</th>
                    <th>Forma de Pagamento</th>
                    <th>Observação</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTransactions.map((t) => (
                    <tr key={t.id} className={t.tipo === 'entrada' ? 'transaction-income' : 'transaction-expense'}>
                      <td>{formatDate(t.data)}</td>
                      <td>{t.descricao}</td>
                      <td>
                        <Badge bg={t.tipo === 'entrada' ? 'success' : 'danger'}>{t.tipo}</Badge>
                      </td>
                      <td className="text-end">{formatCurrency(t.valor)}</td>
                      <td>{t.categoria ?? '-'}</td>
                      <td>{t.formaPagamento ?? '-'}</td>
                      <td>{t.observacao ?? '-'}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button size="sm" variant="outline-secondary" onClick={() => handleEdit(t)}>Editar</Button>
                          <Button size="sm" variant="outline-danger" onClick={() => handleDelete(t.id)}>Excluir</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </StandardTable>
            )}
          </Card.Body>
        </Card>
      </div>
    </Navbar>
  );
};

export default FinanceiroLocal;