import { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PageHeader from '../components/ui/PageHeader';
import HelpButton from '../components/ui/HelpButton';
import ActionIconButton from '../components/ui/ActionIconButton';
import { BoxSeam, PlusCircle, Funnel, Pencil, Trash, ArrowLeftRight, ClockHistory, ArrowUpCircleFill, ArrowDownCircleFill, Eye } from 'react-bootstrap-icons';
import { listarProdutos, deletarProduto, listarMovimentos } from '../services/produtosService';
import { Modal, Button, Spinner, Alert, Collapse } from 'react-bootstrap';
import { categoriasProdutos } from './validacoesProdutos';
import { useAuth } from '../hooks/useAuth';
import { useDialog } from '../context/useDialog';
import MovimentacaoModal from '../components/produtos/MovimentacaoModal';

export default function Produtos() {
  const lastFocusEl = useRef(null);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('');
  const [sort, setSort] = useState('nome');
  const [order, setOrder] = useState('ASC');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [minPreco, setMinPreco] = useState('');
  const [maxPreco, setMaxPreco] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const dialog = useDialog();

  // Estado da movimentação de estoque
  const [showMovModal, setShowMovModal] = useState(false);
  const [movItem, setMovItem] = useState(null);
  

  // Estado de exclusão (modal customizado)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Estado do histórico de estoque
  const [showHistModal, setShowHistModal] = useState(false);
  const [histProduto, setHistProduto] = useState(null);
  const [histItems, setHistItems] = useState([]);
  const [histPage, setHistPage] = useState(1);
  const [histPageSize, setHistPageSize] = useState(10);
  const [histTotal, setHistTotal] = useState(0);
  const [histSort] = useState('data_hora');
  const [histOrder, setHistOrder] = useState('DESC');
  const [histStartDate, setHistStartDate] = useState('');
  const [histEndDate, setHistEndDate] = useState('');
  const [histSearch, setHistSearch] = useState('');
  const [histLoading, setHistLoading] = useState(false);
  const [histError, setHistError] = useState('');
  const [histPeriodo, setHistPeriodo] = useState('last30'); // 'last7','last15','last30','month','custom'
  const [histCustomStartStr, setHistCustomStartStr] = useState(''); // DD/MM/AAAA
  const [histCustomEndStr, setHistCustomEndStr] = useState('');   // DD/MM/AAAA
  const [histDateError, setHistDateError] = useState('');
  const HIST_FILTERS_KEY = 'estoqueHistFilters';


  function parseDateBR(str) {
    const s = String(str || '').trim();
    const m = s.match(/^([0-3]?\d)\/(1?\d)\/(\d{4})$/);
    if (!m) return null;
    const d = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const y = Number(m[3]);
    const dt = new Date(y, mo, d, 0, 0, 0, 0);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  function toSQLDateTime(dt, endOfDay = false) {
    const d = new Date(dt);
    if (endOfDay) {
      d.setHours(23, 59, 59, 999);
    } else {
      d.setHours(0, 0, 0, 0);
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    // MySQL DATETIME/TIMESTAMP friendly format without timezone
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  }

  function parseSQLDateTimeLocal(s) {
    // Garantir interpretação no fuso local, evitando ambiguidade
    const str = String(s || '').replace(' ', 'T');
    const d = new Date(str);
    return Number.isNaN(d.getTime()) ? new Date(s) : d;
  }

  function getPeriodoRange(periodo) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start = new Date(today);
    let end = new Date(today);
    switch (periodo) {
      case 'last7': {
        start = new Date(today);
        start.setDate(start.getDate() - 6);
        end = new Date(today);
        break;
      }
      case 'last15': {
        start = new Date(today);
        start.setDate(start.getDate() - 14);
        end = new Date(today);
        break;
      }
      case 'last30': {
        start = new Date(today);
        start.setDate(start.getDate() - 29);
        end = new Date(today);
        break;
      }
      case 'month': {
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      }
      default: {
        start = new Date(today);
        end = new Date(today);
      }
    }
    return { start, end };
  }

  // Removido: aplicarFiltrosHistorico; usamos aplicação automática via eventos e debounce

  // Aplicação imediata dos filtros com valores fornecidos (sem depender do estado assíncrono)
  function aplicarFiltrosHistoricoInstant(periodo, startStr, endStr) {
    let startDateISO = '';
    let endDateISO = '';
    setHistDateError('');
    if (periodo === 'custom') {
      const s = parseDateBR(startStr);
      const e = parseDateBR(endStr);
      if (!s || !e) {
        setHistDateError('Informe datas válidas no formato DD/MM/AAAA.');
        return;
      }
      if (e.getTime() < s.getTime()) {
        setHistDateError('A data final não pode ser anterior à data inicial.');
        return;
      }
      startDateISO = toSQLDateTime(s, false);
      endDateISO = toSQLDateTime(e, true);
    } else {
      const { start, end } = getPeriodoRange(periodo);
      startDateISO = toSQLDateTime(start, false);
      endDateISO = toSQLDateTime(end, true);
    }
    setHistStartDate(startDateISO);
    setHistEndDate(endDateISO);
    setHistPage(1);
    carregarHistorico(histProduto?.id, { startDate: startDateISO, endDate: endDateISO });
  }

  // Debounce da busca para aplicar automaticamente sem excesso de requisições
  useEffect(() => {
    if (!showHistModal) return;
    const handler = setTimeout(() => {
      setHistPage(1);
      carregarHistorico(histProduto?.id);
    }, 300);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [histSearch]);

  

  function abrirMovimentacao(item) {
    lastFocusEl.current = document.activeElement;
    setMovItem(item || null);
    setShowMovModal(true);
  }

  function fecharMovimentacao() {
    setShowMovModal(false);
    setMovItem(null);
    const el = lastFocusEl.current;
    if (el && typeof el.focus === 'function') el.focus();
  }

  function abrirConfirmarExclusao(item) {
    if (!isAdmin) return;
    setDeleteItem(item || null);
    setDeleteError('');
    setShowDeleteModal(true);
  }

  function fecharDeleteModal() {
    setShowDeleteModal(false);
    setDeleteItem(null);
    setDeleteError('');
    setDeleteSubmitting(false);
  }

  async function confirmarExclusaoProduto() {
    if (!isAdmin || !deleteItem) return;
    try {
      setDeleteSubmitting(true);
      setDeleteError('');
      const res = await deletarProduto(deleteItem.id);
      if (res?.success) {
        setSuccess('Produto excluído com sucesso');
        fecharDeleteModal();
        await load();
      } else {
        setDeleteError(res?.error || 'Falha ao excluir produto');
      }
    } catch (err) {
      const status = err?.response?.status;
      const detail = String(err?.response?.data?.detail || err?.response?.data?.error || err?.message || '');
      const isRelacionamento = status === 409 || /foreign key constraint fails|ER_ROW_IS_REFERENCED/i.test(detail);
      if (isRelacionamento) {
        // Fecha o modal de confirmação e mostra alerta padronizado
        fecharDeleteModal();
        dialog.alert(
          (
            <div>
              <Alert variant="danger" className="mb-3">
                <strong>Operação não permitida.</strong><br />
                Este item de estoque não pode ser excluído pois está vinculado a uma doação registrada no sistema.
              </Alert>
              <p className="mb-3">
                Para remover este item, primeiro exclua as doações que o utilizam ou entre em contato com o administrador do sistema.
              </p>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Produto: {deleteItem?.nome}</span>
              </div>
            </div>
          ),
          { title: 'Exclusão não permitida', okLabel: 'Entendi' }
        );
      } else {
        setDeleteError(err?.message || 'Erro ao excluir produto');
      }
    } finally {
      setDeleteSubmitting(false);
    }
  }

  async function abrirHistorico(item) {
    setHistProduto(item || null);
    setShowHistModal(true);
    setHistPage(1);
    // Restaurar filtros da sessão (escopo por produto)
    try {
      const raw = sessionStorage.getItem(`${HIST_FILTERS_KEY}:${item?.id}`);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved === 'object') {
          setHistPeriodo(saved.histPeriodo ?? 'last30');
          setHistCustomStartStr(saved.histCustomStartStr ?? '');
          setHistCustomEndStr(saved.histCustomEndStr ?? '');
          setHistOrder(saved.histOrder ?? 'DESC');
          setHistSearch(saved.histSearch ?? '');
          setHistStartDate(saved.histStartDate ?? '');
          setHistEndDate(saved.histEndDate ?? '');
        }
      } else {
        // Aplicar período padrão ao abrir
        aplicarFiltrosHistoricoInstant('last30', '', '');
      }
    } catch (err) {
      // Ignorar erros ao restaurar filtros da sessão (dados ausentes/corrompidos)
      console.debug('Ignorando erro ao restaurar filtros do histórico', err);
    }
    await carregarHistorico(item?.id);
  }

  function fecharHistorico() {
    setShowHistModal(false);
    setHistProduto(null);
    setHistItems([]);
    setHistError('');
  }

  async function carregarHistorico(produtoId, overrides = {}) {
    if (!produtoId) return;
    setHistLoading(true);
    setHistError('');
    try {
      const useStartDate = overrides.startDate ?? histStartDate;
      const useEndDate = overrides.endDate ?? histEndDate;
      const res = await listarMovimentos(produtoId, {
        page: histPage,
        pageSize: histPageSize,
        sort: histSort,
        order: histOrder,
        startDate: useStartDate || undefined,
        endDate: useEndDate || undefined,
        search: histSearch || undefined,
      });
      if (res?.success) {
        const raw = Array.isArray(res.data) ? res.data : [];
        let filtered = raw;
        if (useStartDate && useEndDate) {
          const startMs = parseSQLDateTimeLocal(useStartDate).getTime();
          const endMs = parseSQLDateTimeLocal(useEndDate).getTime();
          filtered = raw.filter(m => {
            const t = parseSQLDateTimeLocal(m.data_hora).getTime();
            return t >= startMs && t <= endMs;
          });
        }
        setHistItems(filtered);
        setHistTotal(Number(res.total || filtered.length || 0));
      } else {
        setHistError(res?.error || 'Falha ao carregar histórico');
      }
    } catch {
      setHistError('Erro ao carregar histórico');
    } finally {
      setHistLoading(false);
    }
  }

  // Persistência dos filtros na sessão (por produto)
  useEffect(() => {
    if (!histProduto?.id) return;
    const data = {
      histPeriodo,
      histCustomStartStr,
      histCustomEndStr,
      histOrder,
      histSearch,
      histStartDate,
      histEndDate,
    };
    try {
      sessionStorage.setItem(`${HIST_FILTERS_KEY}:${histProduto.id}`, JSON.stringify(data));
    } catch (err) {
      // Ignorar falhas ao salvar filtros (quota cheia/navegador bloqueando storage)
      console.debug('Falha ao salvar filtros do histórico na sessão', err);
    }
  }, [histPeriodo, histCustomStartStr, histCustomEndStr, histOrder, histSearch, histStartDate, histEndDate, histProduto?.id]);

  // Removidos: exportarCSV e exportarPDF (botões de exportação descontinuados)

  

  const formatBRL = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0));

  async function load() {
    setError('');
    setSuccess('');
    try {
      const params = { search, categoria, sort, order, ...(minPreco !== '' ? { minPreco: Number(minPreco) } : {}), ...(maxPreco !== '' ? { maxPreco: Number(maxPreco) } : {}) };
      const res = await listarProdutos(params);
      if (res?.success) {
        setItems(res.data || []);
      } else {
        setError(res?.error || 'Falha ao carregar produtos');
      }
    } catch {
      setError('Erro ao conectar ao servidor');
    }
  }

  // Suporte a mensagem de sucesso vinda da página de cadastro
  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);
      navigate(location.pathname, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => { load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoria, minPreco, maxPreco, sort, order]);

  return (
    <Navbar sidebarInactive={showMovModal}>
      <div className="container-fluid" style={{ padding: 'var(--gap-2)' }}>
        <PageHeader
          title="Estoque"
          icon={<BoxSeam />}
          suffix={<HelpButton inline iconOnly />}
          actions={
            <>
              <Link
                to="/produtos/novo"
                className={`btn btn-primary d-inline-flex align-items-center ${!isAdmin ? 'disabled-action' : ''}`}
                onClick={!isAdmin ? (e) => e.preventDefault() : undefined}
              >
                <PlusCircle className="me-1" size={16} /> Novo Produto
              </Link>
              <button
                type="button"
                className={`btn btn-mov-roxo d-inline-flex align-items-center ms-2 ${!isAdmin ? 'disabled-action' : ''}`}
                onClick={!isAdmin ? undefined : () => abrirMovimentacao(null)}
                title="Movimentar Estoque"
                disabled={!isAdmin}
              >
                <ArrowLeftRight className="me-1" size={16} /> Movimentar
              </button>
            </>
          }
        />
        {error && <div role="alert" className="alert alert-danger">{error}</div>}
        {success && <div role="status" className="alert alert-success">{success}</div>}

        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Filtros e Busca</h5>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center"
              onClick={() => setShowFilters(v => !v)}
              title="Mostrar/ocultar filtros"
            >
              <Funnel className="me-1" size={16} /> Filtros
            </button>
          </div>
          <div className={`card-body collapse ${showFilters ? 'show' : ''}`}>
            {/* Linha 1: Busca, Categoria, Ordenar por */}
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="search">Buscar Produto</label>
                <input 
                  id="search" 
                  className="form-control" 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  placeholder="Buscar..." 
                />
              </div>
              <div className="col-md-3">
                <label className="form-label" htmlFor="categoria">Categoria</label>
                <select id="categoria" className="form-select" value={categoria} onChange={e => setCategoria(e.target.value)}>
                  <option value="">Todas as categorias</option>
                  {categoriasProdutos.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label" htmlFor="sort">Ordenar por</label>
                <select id="sort" className="form-select" value={sort} onChange={e => setSort(e.target.value)}>
                  <option value="nome">Nome</option>
                  <option value="preco">Preço</option>
                  <option value="quantidade">Quantidade</option>
                  <option value="data_cadastro">Data de Cadastro</option>
                </select>
              </div>
            </div>

            {/* Linha 2: Preço, Ordem, Limpar */}
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label" htmlFor="minPreco">Preço Mínimo</label>
                <input 
                  id="minPreco" 
                  className="form-control" 
                  value={minPreco} 
                  onChange={e => setMinPreco(e.target.value.replace(/,/g, '.'))} 
                  placeholder="0.00" 
                />
              </div>
              <div className="col-md-3">
                <label className="form-label" htmlFor="maxPreco">Preço Máximo</label>
                <input 
                  id="maxPreco" 
                  className="form-control" 
                  value={maxPreco} 
                  onChange={e => setMaxPreco(e.target.value.replace(/,/g, '.'))} 
                  placeholder="0.00" 
                />
              </div>
              <div className="col-md-3">
                <label className="form-label" htmlFor="order">Ordem</label>
                <select id="order" className="form-select" value={order} onChange={e => setOrder(e.target.value)}>
                  <option value="ASC">Crescente (A→Z ou Menor→Maior)</option>
                  <option value="DESC">Decrescente (Z→A ou Maior→Menor)</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">&nbsp;</label>
                <button 
                  type="button" 
                  className="btn btn-outline-secondary w-100"
                  onClick={() => {
                    setSearch('');
                    setCategoria('');
                    setMinPreco('');
                    setMaxPreco('');
                    setSort('nome');
                    setOrder('ASC');
                  }}
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          </div>
        </div>

          <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Produtos</h5>
            <Button
              variant="outline-secondary"
              onClick={() => {
                const params = new URLSearchParams();
                if (search) params.set('search', search);
                if (categoria) params.set('categoria', categoria);
                if (minPreco !== '') params.set('minPreco', String(minPreco));
                if (maxPreco !== '') params.set('maxPreco', String(maxPreco));
                if (sort) params.set('sort', sort);
                if (order) params.set('order', order);
                navigate(`/produtos/impressao?${params.toString()}`);
              }}
              className="d-inline-flex align-items-center"
            >
              Imprimir
            </Button>
          </div>
          <div className="card-body">
            <div className="table-responsive" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <table className="table table-striped table-hover align-middle">
                <thead className="sticky-top bg-white">
                  <tr>
                    <th>Nome</th>
                    <th>Categoria</th>
                    <th className="text-end">Quantidade</th>
                    <th className="text-end">Preço</th>
                    <th className="text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(p => (
                    <tr key={p.id}>
                      <td>{p.nome}</td>
                      <td>{p.categoria}</td>
                      <td className="text-end">{p.quantidade} {p.unidade_medida || ''}</td>
                      <td className="text-end">{formatBRL(p.preco)}</td>
                      <td>
                        <div className="botoes-acao d-flex justify-content-center gap-2">
                          <ActionIconButton
                            as={Link}
                            to={`/produtos/detalhes/${p.id}`}
                            variant="outline-secondary"
                            title="Detalhes"
                            ariaLabel="Detalhes do produto"
                          >
                            <Eye />
                          </ActionIconButton>
                          <ActionIconButton
                            as={Link}
                            to={`/produtos/editar/${p.id}`}
                            variant="outline-primary"
                            title="Editar"
                            ariaLabel="Editar produto"
                            disabled={!isAdmin}
                            className={!isAdmin ? 'disabled-action' : ''}
                            onClick={!isAdmin ? (e) => e.preventDefault() : undefined}
                          >
                            <Pencil />
                          </ActionIconButton>
                          <ActionIconButton
                            variant="outline-purple"
                            title="Movimentar"
                            ariaLabel="Movimentar estoque"
                            disabled={!isAdmin}
                            className={!isAdmin ? 'disabled-action' : ''}
                            onClick={!isAdmin ? undefined : () => abrirMovimentacao(p)}
                          >
                            <ArrowLeftRight />
                          </ActionIconButton
                          >
                          <ActionIconButton
                            variant="outline-secondary"
                            title="Histórico"
                            ariaLabel="Histórico de movimentações"
                            onClick={() => abrirHistorico(p)}
                          >
                            <ClockHistory />
                          </ActionIconButton>
                          <ActionIconButton
                            variant="outline-danger"
                            title="Excluir"
                            disabled={!isAdmin}
                            className={!isAdmin ? 'disabled-action' : ''}
                            onClick={!isAdmin ? undefined : () => abrirConfirmarExclusao(p)}
                          >
                            <Trash />
                          </ActionIconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!items.length && (
                <div className="text-muted">Nenhum produto encontrado.</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <MovimentacaoModal
        show={showMovModal}
        onClose={fecharMovimentacao}
        item={movItem}
        items={items}
        onSuccess={async (msg) => { setSuccess(msg); await load(); }}
      />

      {/* Modal de Exclusão de Produto (padronizado) */}
      <Modal show={showDeleteModal} onHide={fecharDeleteModal} dialogClassName="modal-top" aria-labelledby="excluir-title" aria-describedby="excluir-desc">
        <Modal.Header closeButton>
          <Modal.Title id="excluir-title">Confirmar Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <strong>Atenção:</strong> Ao excluir este item, todo o seu histórico de movimentações será permanentemente removido.
          </Alert>
          <p>
            Se desejar manter um registro das informações, recomendamos que você baixe o histórico em formato PDF antes de prosseguir com a exclusão.
          </p>
          <p id="excluir-desc">Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.</p>
          {deleteItem && (
            <p className="fw-bold">{deleteItem.nome}</p>
          )}
          {deleteError && (
            <div role="alert" className="alert alert-danger mt-2">{deleteError}</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={fecharDeleteModal} disabled={deleteSubmitting} autoFocus>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={confirmarExclusaoProduto}
            disabled={deleteSubmitting}
            className={deleteSubmitting ? 'disabled-action' : undefined}
          >
            {deleteSubmitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Excluindo...</span>
              </>
            ) : 'Excluir'}
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Modal de Histórico de Estoque */}
      <Modal show={showHistModal} onHide={fecharHistorico} size="xl" aria-labelledby="historico-title" centered>
        <Modal.Header closeButton>
          <Modal.Title id="historico-title">Histórico de Estoque - {histProduto?.nome || 'Selecionado'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {histError && <div role="alert" className="alert alert-danger">{histError}</div>}
            <div className="row g-3 mb-3">
              <div className="col-md-3">
                <label className="form-label" htmlFor="histPeriodo">Período</label>
                <select id="histPeriodo" className="form-select" value={histPeriodo} onChange={e => { const val = e.target.value; setHistPeriodo(val); aplicarFiltrosHistoricoInstant(val, histCustomStartStr, histCustomEndStr); }} aria-label="Seleção rápida de período">
                  <option value="last7">Últimos 7 dias</option>
                  <option value="last15">Últimos 15 dias</option>
                  <option value="last30">Últimos 30 dias</option>
                  <option value="month">Mês atual</option>
                  <option value="custom">Personalizar…</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label" htmlFor="histOrder">Ordenação</label>
                <select id="histOrder" className="form-select" value={histOrder} onChange={e => { setHistOrder(e.target.value); setHistPage(1); carregarHistorico(histProduto?.id); }}>
                  <option value="DESC">Mais recente</option>
                  <option value="ASC">Mais antigo</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label" htmlFor="histSearch">Buscar</label>
                <input id="histSearch" className="form-control" value={histSearch} onChange={e => setHistSearch(e.target.value)} placeholder="Buscar..." />
              </div>
            </div>
            {/* Indicadores removidos conforme solicitado */}
          <Collapse in={histPeriodo === 'custom'}>
            <div>
              <div className="row g-3 mb-2">
                <div className="col-md-3">
                  <label className="form-label" htmlFor="histCustomStart">Data inicial</label>
                  <input
                    id="histCustomStart"
                    type="text"
                    inputMode="numeric"
                    className={`form-control ${histDateError ? 'is-invalid' : ''}`}
                    placeholder="DD/MM/AAAA"
                    value={histCustomStartStr}
                    required
                    aria-invalid={!!histDateError}
                    aria-describedby="histDateErrorMsg"
                    onChange={e => { const v = e.target.value; setHistCustomStartStr(v); if (histPeriodo === 'custom') { aplicarFiltrosHistoricoInstant('custom', v, histCustomEndStr); } }}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label" htmlFor="histCustomEnd">Data final</label>
                  <input
                    id="histCustomEnd"
                    type="text"
                    inputMode="numeric"
                    className={`form-control ${histDateError ? 'is-invalid' : ''}`}
                    placeholder="DD/MM/AAAA"
                    value={histCustomEndStr}
                    required
                    aria-invalid={!!histDateError}
                    aria-describedby="histDateErrorMsg"
                    onChange={e => { const v = e.target.value; setHistCustomEndStr(v); if (histPeriodo === 'custom') { aplicarFiltrosHistoricoInstant('custom', histCustomStartStr, v); } }}
                  />
                </div>
              </div>
              {histDateError && (
                <div id="histDateErrorMsg" role="alert" aria-live="polite" className="alert alert-warning py-2">{histDateError}</div>
              )}
            </div>
          </Collapse>
          {/* Botões removidos conforme solicitação: Aplicar filtros, Limpar, Exportar CSV/PDF */}

          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Operação</th>
                  <th className="text-end">Quantidade</th>
                  <th className="text-end">Saldo Anterior</th>
                  <th className="text-end">Saldo Posterior</th>
                  <th>Responsável</th>
                  <th>Observações</th>
                </tr>
              </thead>
              <tbody>
                {histItems.map(m => (
                  <tr key={m.id}>
                    <td>{parseSQLDateTimeLocal(m.data_hora).toLocaleString()}</td>
                    <td>
                      {m.tipo === 'entrada' && <ArrowUpCircleFill className="text-success me-1" />}
                      {m.tipo === 'saida' && <ArrowDownCircleFill className="text-danger me-1" />}
                      {m.tipo}
                    </td>
                    <td className="text-end">{m.quantidade}</td>
                    <td className="text-end">{m.saldo_anterior}</td>
                    <td className="text-end">{m.saldo_posterior}</td>
                    <td>{m.responsavel_nome || ''}</td>
                    <td>{m.observacao || ''}</td>
                  </tr>
                ))}
                {histItems.length === 0 && !histLoading && (
                  <tr>
                    <td colSpan={7}>
                      <div className="alert alert-info mb-0" role="status" aria-live="polite">
                        Nenhuma movimentação encontrada no período selecionado. Ajuste o intervalo ou utilize uma seleção rápida.
                      </div>
                    </td>
                  </tr>
                )}
                {histItems.length === 0 && !histLoading && (
                  <tr><td colSpan={7} className="text-center text-muted">Nenhuma movimentação encontrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="d-flex justify-content-between align-items-center mt-2">
            <div className="text-muted">Total: {histTotal} registros</div>
            <div className="d-flex gap-2 align-items-center">
              <label className="form-label mb-0">Página</label>
              <Button variant="outline-secondary" disabled={histPage <= 1} onClick={() => { setHistPage(p => Math.max(p-1,1)); carregarHistorico(histProduto?.id); }}>Anterior</Button>
              <span>{histPage}</span>
              <Button variant="outline-secondary" disabled={(histPage * histPageSize) >= histTotal} onClick={() => { setHistPage(p => p + 1); carregarHistorico(histProduto?.id); }}>Próximo</Button>
              <select className="form-select form-select-sm ms-2" value={histPageSize} onChange={e => { setHistPageSize(Number(e.target.value)); setHistPage(1); carregarHistorico(histProduto?.id); }}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={fecharHistorico}>Fechar</Button>
        </Modal.Footer>
      </Modal>
    </Navbar>
  );
}
