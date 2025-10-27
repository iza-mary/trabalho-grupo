import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import PageHeader from '../components/ui/PageHeader';
import StandardTable from '../components/ui/StandardTable';
import financeiroService from '../services/financeiroService';
import { CashStack, Funnel, Pencil, Trash, PlusCircle, CalendarEvent } from 'react-bootstrap-icons';
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
  // Filtro independente para controlar apenas a tabela (card collapse)
  const [tableFilter, setTableFilter] = useState({ period: 'all', startDate: '', endDate: '' });

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

  // Persistência do seletor de período
  useEffect(() => {
    try {
      const stored = localStorage.getItem('finance_period_filter');
      if (stored) {
        const parsed = JSON.parse(stored);
        setFilter((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      void 0; // noop: falha ao ler persistência do período
    }
  }, []);

  useEffect(() => {
    try {
      const toStore = { period: filter.period, startDate: filter.startDate, endDate: filter.endDate };
      localStorage.setItem('finance_period_filter', JSON.stringify(toStore));
    } catch {
      void 0; // noop: falha ao gravar persistência do período
    }
  }, [filter.period, filter.startDate, filter.endDate]);

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

  // Função para formatar data no formato DD/MM/AAAA
  const formatDateBR = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Função para obter nome do dia da semana
  const getDayName = (date) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days[new Date(date).getDay()];
  };

  // Calcular intervalo de datas para exibição
  const dateRange = useMemo(() => {
    const now = new Date();
    let start, end, showDays = false;

    switch (filter.period) {
      case 'last7': {
        const s = new Date(now);
        s.setDate(s.getDate() - 6);
        start = new Date(s.getFullYear(), s.getMonth(), s.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        showDays = true;
        break;
      }
      case 'last30': {
        const s = new Date(now);
        s.setDate(s.getDate() - 29);
        start = new Date(s.getFullYear(), s.getMonth(), s.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      }
      case 'month': {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      }
      case 'quarter': {
        const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
        start = new Date(now.getFullYear(), qStartMonth, 1);
        end = new Date(now.getFullYear(), qStartMonth + 3, 0);
        break;
      }
      case 'year': {
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      }
      case 'custom': {
        start = filter.startDate ? new Date(filter.startDate) : null;
        end = filter.endDate ? new Date(filter.endDate) : null;
        break;
      }
      default: {
        return null; // Não exibir para "Todos"
      }
    }

    if (!start || !end) return null;

    return {
      start,
      end,
      showDays,
      startFormatted: formatDateBR(start),
      endFormatted: formatDateBR(end),
      startDay: showDays ? getDayName(start) : null,
      endDay: showDays ? getDayName(end) : null
    };
  }, [filter.period, filter.startDate, filter.endDate]);

  // Totais baseados no período selecionado
  const { totalEntradas, totalSaidas, saldoAtual } = useMemo(() => {
    const now = new Date();
    let start = new Date(0);
    let end = new Date('9999-12-31');

    // Mapear períodos solicitados
    switch (filter.period) {
      case 'last7': {
        const s = new Date(now);
        s.setDate(s.getDate() - 6);
        start = new Date(s.getFullYear(), s.getMonth(), s.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      }
      case 'last30': {
        const s = new Date(now);
        s.setDate(s.getDate() - 29);
        start = new Date(s.getFullYear(), s.getMonth(), s.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      }
      case 'month': {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      }
      case 'quarter': {
        const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
        start = new Date(now.getFullYear(), qStartMonth, 1);
        end = new Date(now.getFullYear(), qStartMonth + 3, 0);
        break;
      }
      case 'year': {
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      }
      case 'custom': {
        start = filter.startDate ? new Date(filter.startDate) : new Date(0);
        end = filter.endDate ? new Date(filter.endDate) : now;
        break;
      }
      default: {
        // 'all' e outros não filtram
        start = new Date(0);
        end = new Date('9999-12-31');
      }
    }

    // Validar intervalo customizado
    const invalidRange = filter.period === 'custom' && filter.startDate && filter.endDate && new Date(filter.startDate) > new Date(filter.endDate);
    const dataInRange = (d) => {
      if (!d?.data) return true;
      const t = new Date(d.data).getTime();
      return t >= start.getTime() && t <= end.getTime();
    };

    let entradas = 0;
    let saidas = 0;
    for (const d of despesas) {
      if (!invalidRange && !dataInRange(d)) continue;
      const tipo = String(d.tipo || '');
      const valor = Number(d.valor || 0);
      if (tipo === 'Entrada') entradas += valor;
      if (tipo === 'Saída') saidas += valor;
    }

    return { totalEntradas: entradas, totalSaidas: saidas, saldoAtual: entradas - saidas };
  }, [despesas, filter]);

  const visibleDespesas = useMemo(() => {
    const byTipo = (d) => filter.tipo === 'todas' || String(d.tipo) === filter.tipo;
    const bySearch = (d) => {
      const q = String(filter.search || '').toLowerCase();
      if (!q) return true;
      return String(d.descricao || '').toLowerCase().includes(q) || String(d.observacao || '').toLowerCase().includes(q);
    };
    const byCategory = (d) => !filter.category || String(d.categoria) === filter.category;
    // Datas controladas apenas pelo filtro da tabela
    const { startDate, endDate, period } = tableFilter;
    const today = new Date();
    let start = new Date(0);
    let end = new Date('9999-12-31');
    if (period === 'last7') {
      const s = new Date(today);
      s.setDate(s.getDate() - 6);
      start = new Date(s.getFullYear(), s.getMonth(), s.getDate());
      end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    } else if (period === 'last30') {
      const s = new Date(today);
      s.setDate(s.getDate() - 29);
      start = new Date(s.getFullYear(), s.getMonth(), s.getDate());
      end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    } else if (period === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (period === 'quarter') {
      const qStartMonth = Math.floor(today.getMonth() / 3) * 3;
      start = new Date(today.getFullYear(), qStartMonth, 1);
      end = new Date(today.getFullYear(), qStartMonth + 3, 0);
    } else if (period === 'today') {
      start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    } else if (period === 'year') {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
    } else if (period === 'custom') {
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
  }, [despesas, filter, tableFilter]);

  return (
    <Navbar disableSidebar={showModal}>
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

        {/* Seletor de período abaixo do page-header */}
        <Card className="mb-3">
          <Card.Body>
            <Row className="g-3 align-items-end">
              <Col md={4} sm={12}>
                <Form.Group controlId="periodSelector">
                  <Form.Label className="d-flex align-items-center gap-2">
                    <CalendarEvent />
                    <span>Período</span>
                  </Form.Label>
                  <Form.Select
                    value={filter.period}
                    onChange={(e) => {
                      const next = e.target.value;
                      setLoading(true);
                      setFilter({ ...filter, period: next });
                      setTimeout(() => setLoading(false), 300);
                    }}
                  >
                    <option value="all">Todos</option>
                    <option value="last7">Últimos 7 dias</option>
                    <option value="last30">Últimos 30 dias</option>
                    <option value="month">Mês atual</option>
                    <option value="quarter">Trimestre atual</option>
                    <option value="year">Ano atual</option>
                    <option value="custom">Personalizado</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              {filter.period === 'custom' && (
                <>
                  <Col md={4} sm={6}>
                    <Form.Group controlId="periodStart">
                      <Form.Label>De</Form.Label>
                      <Form.Control
                        type="date"
                        value={filter.startDate}
                        onChange={(e) => {
                          setLoading(true);
                          setFilter({ ...filter, startDate: e.target.value });
                          setTimeout(() => setLoading(false), 300);
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4} sm={6}>
                    <Form.Group controlId="periodEnd">
                      <Form.Label>Até</Form.Label>
                      <Form.Control
                        type="date"
                        value={filter.endDate}
                        onChange={(e) => {
                          setLoading(true);
                          setFilter({ ...filter, endDate: e.target.value });
                          setTimeout(() => setLoading(false), 300);
                        }}
                      />
                    </Form.Group>
                  </Col>
                </>
              )}
            </Row>
            {filter.period === 'custom' && filter.startDate && filter.endDate && new Date(filter.startDate) > new Date(filter.endDate) && (
              <Alert variant="warning" className="mt-3">Intervalo inválido: a data inicial não pode ser maior que a final.</Alert>
            )}
            {loading && (
              <div className="d-flex align-items-center gap-2 mt-3">
                <Spinner animation="border" size="sm" />
                <small className="text-muted">Atualizando...</small>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Exibição do intervalo de datas selecionado */}
        {dateRange && (
          <div className="mb-3">
            <div 
              className="d-inline-flex align-items-center px-3 py-2 rounded-3 border"
              style={{
                backgroundColor: '#e3f2fd',
                borderColor: '#2196f3',
                borderWidth: '2px',
                fontSize: '0.95rem',
                fontWeight: '500'
              }}
            >
              <CalendarEvent className="me-2 text-primary" size={18} />
              <span className="text-primary">
                <span className="d-none d-sm-inline">Período selecionado: </span>
                <strong>
                  {dateRange.showDays ? (
                    <>
                      <span className="d-none d-md-inline">
                        {dateRange.startDay} {dateRange.startFormatted} - {dateRange.endDay} {dateRange.endFormatted}
                      </span>
                      <span className="d-md-none">
                        {dateRange.startFormatted} - {dateRange.endFormatted}
                      </span>
                    </>
                  ) : (
                    `${dateRange.startFormatted} - ${dateRange.endFormatted}`
                  )}
                </strong>
              </span>
            </div>
          </div>
        )}

        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
        {successMsg && <Alert variant="success" className="mb-3">{successMsg}</Alert>}

        {/* Resumo estilizado (atualiza conforme período) */}
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
                  <Form.Select value={tableFilter.period ?? ''} onChange={(e) => setTableFilter({ ...tableFilter, period: e.target.value })}>
                    <option value="all">Todos</option>
                    <option value="last7">Últimos 7 dias</option>
                    <option value="last30">Últimos 30 dias</option>
                    <option value="today">Hoje</option>
                    <option value="month">Mês atual</option>
                    <option value="quarter">Trimestre atual</option>
                    <option value="year">Ano atual</option>
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
              {tableFilter.period === 'custom' && (
                <>
                  <Col md={3}>
                    <Form.Group controlId="filterStart">
                      <Form.Label>De</Form.Label>
                      <Form.Control type="date" value={tableFilter.startDate ?? ''} onChange={(e) => setTableFilter({ ...tableFilter, startDate: e.target.value })} />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="filterEnd">
                      <Form.Label>Até</Form.Label>
                      <Form.Control type="date" value={tableFilter.endDate ?? ''} onChange={(e) => setTableFilter({ ...tableFilter, endDate: e.target.value })} />
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
