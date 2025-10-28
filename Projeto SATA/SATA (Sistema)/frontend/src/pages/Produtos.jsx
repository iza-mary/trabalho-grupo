import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PageHeader from '../components/ui/PageHeader';
import ActionIconButton from '../components/ui/ActionIconButton';
import { BoxSeam, PlusCircle, Funnel, Pencil, Trash, ArrowLeftRight, ClockHistory, ArrowUpCircleFill, ArrowDownCircleFill } from 'react-bootstrap-icons';
import { listarProdutos, deletarProduto, movimentarProduto, listarMovimentos } from '../services/produtosService';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import { categoriasProdutos } from './validacoesProdutos';
import { useAuth } from '../hooks/useAuth';
import { useDialog } from '../context/DialogContext';

export default function Produtos() {
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
  const [movProdutoId, setMovProdutoId] = useState('');
  const [movType, setMovType] = useState('entrada'); // 'entrada' ou 'saida'
  const [movQty, setMovQty] = useState('');
  const [movNotes, setMovNotes] = useState('');
  const [movError, setMovError] = useState('');
  const [movSubmitting, setMovSubmitting] = useState(false);

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

  function abrirMovimentacao(item) {
    setMovItem(item || null);
    setMovProdutoId(item?.id ? String(item.id) : '');
    setMovType('entrada');
    setMovQty('');
    setMovNotes('');
    setMovError('');
    setShowMovModal(true);
  }

  function fecharMovimentacao() {
    setShowMovModal(false);
    setMovItem(null);
    setMovProdutoId('');
    setMovError('');
    setMovSubmitting(false);
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
    await carregarHistorico(item?.id);
  }

  function fecharHistorico() {
    setShowHistModal(false);
    setHistProduto(null);
    setHistItems([]);
    setHistError('');
  }

  async function carregarHistorico(produtoId) {
    if (!produtoId) return;
    setHistLoading(true);
    setHistError('');
    try {
      const res = await listarMovimentos(produtoId, {
        page: histPage,
        pageSize: histPageSize,
        sort: histSort,
        order: histOrder,
        startDate: histStartDate || undefined,
        endDate: histEndDate || undefined,
        search: histSearch || undefined,
      });
      if (res?.success) {
        setHistItems(Array.isArray(res.data) ? res.data : []);
        setHistTotal(Number(res.total || 0));
      } else {
        setHistError(res?.error || 'Falha ao carregar histórico');
      }
    } catch {
      setHistError('Erro ao carregar histórico');
    } finally {
      setHistLoading(false);
    }
  }

  function exportarCSV() {
    const headers = ['Data/Hora','Operação','Quantidade','Saldo Anterior','Saldo Posterior','Responsável','Observações'];
    const rows = histItems.map(m => [
      new Date(m.data_hora).toLocaleString(),
      m.tipo,
      m.quantidade,
      m.saldo_anterior,
      m.saldo_posterior,
      m.responsavel_nome || '',
      m.observacao || '',
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.map(v => String(v).replace(/;/g, ',')).join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico_estoque_${histProduto?.nome || 'produto'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportarPDF() {
    // Exportação simples via impressão do conteúdo da tabela (usuário pode salvar em PDF)
    window.print();
  }

  async function confirmarMovimentacao() {
    setMovError('');
    let item = movItem;
    if (!item) {
      const idSel = Number(movProdutoId);
      if (!Number.isFinite(idSel) || idSel <= 0) {
        setMovError('Selecione um produto para movimentar.');
        return;
      }
      item = items.find((x) => Number(x.id) === idSel);
      if (!item) {
        setMovError('Produto selecionado não encontrado.');
        return;
      }
    }
    const qty = Number(movQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      setMovError('Informe uma quantidade válida maior que zero.');
      return;
    }
    const atual = Number(item.quantidade || 0);
    if (movType === 'saida' && qty > atual) {
      setMovError('Não é possível remover quantidade superior ao estoque atual.');
      return;
    }
    try {
      setMovSubmitting(true);
      const res = await movimentarProduto(item.id, { tipo: movType, quantidade: qty, observacao: movNotes });
      if (res?.success) {
        const abaixoMinimo = !!res?.abaixoMinimo;
        setSuccess(
          abaixoMinimo
            ? 'Movimentação realizada. Atenção: estoque abaixo do mínimo.'
            : 'Movimentação realizada com sucesso.'
        );
        fecharMovimentacao();
        await load();
      } else {
        setMovError(res?.error || 'Falha ao registrar movimentação de estoque.');
      }
    } catch (err) {
      setMovError(err?.message || 'Erro ao realizar movimentação.');
    } finally {
      setMovSubmitting(false);
    }
  }

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
    <Navbar disableSidebar={showMovModal}>
      <div className="container-fluid" style={{ padding: 'var(--gap-2)' }}>
        <PageHeader
          title="Estoque"
          icon={<BoxSeam />}
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
                  placeholder="Digite o nome do produto..." 
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
      {/* Modal de Movimentação de Estoque */}
      <Modal show={showMovModal} onHide={fecharMovimentacao} centered>
        <Modal.Header closeButton>
          <Modal.Title>Movimentar Estoque</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!movItem && (
            <div className="mb-3">
              <label className="form-label" htmlFor="movProduto">Produto</label>
              <select
                id="movProduto"
                className="form-select"
                value={movProdutoId}
                onChange={(e) => setMovProdutoId(e.target.value)}
              >
                <option value="">Selecione um produto</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>{it.nome}</option>
                ))}
              </select>
            </div>
          )}
          {movItem && (
            <div className="mb-3">
              <div className="mb-2"><strong>Produto:</strong> {movItem.nome}</div>
              <div className="mb-2"><strong>Estoque atual:</strong> {Number(movItem.quantidade || 0)}</div>
              <div className="mb-2"><strong>Estoque mínimo:</strong> {Number(movItem.estoque_minimo || 0)}</div>
            </div>
          )}
          <div className="mb-3">
            <label className="form-label">Tipo de operação</label>
            <select className="form-select" value={movType} onChange={e => setMovType(e.target.value)}>
              <option value="entrada">Entrada (Adicionar)</option>
              <option value="saida">Saída (Remover)</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="movQty">Quantidade</label>
            <input
              id="movQty"
              type="number"
              className="form-control"
              min={1}
              value={movQty}
              onChange={e => setMovQty(e.target.value)}
              placeholder="Informe a quantidade"
            />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="movNotes">Observação (opcional)</label>
            <textarea
              id="movNotes"
              className="form-control"
              rows={3}
              value={movNotes}
              onChange={e => setMovNotes(e.target.value)}
              placeholder="Ex.: ajuste de inventário, compra, perda, etc."
            />
          </div>
          {movError && <div role="alert" className="alert alert-danger">{movError}</div>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={fecharMovimentacao} disabled={movSubmitting}>Cancelar</Button>
          <Button variant="primary" onClick={confirmarMovimentacao} disabled={movSubmitting}>
            {movSubmitting ? 'Salvando...' : 'Confirmar'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Exclusão de Produto (padronizado) */}
      <Modal show={showDeleteModal} onHide={fecharDeleteModal} dialogClassName="modal-top" aria-labelledby="excluir-title" aria-describedby="excluir-desc">
        <Modal.Header closeButton>
          <Modal.Title id="excluir-title">Confirmar Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
              <label className="form-label" htmlFor="histStart">Início</label>
              <input id="histStart" type="datetime-local" className="form-control" value={histStartDate}
                     onChange={e => setHistStartDate(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="histEnd">Fim</label>
              <input id="histEnd" type="datetime-local" className="form-control" value={histEndDate}
                     onChange={e => setHistEndDate(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="histOrder">Ordenação</label>
              <select id="histOrder" className="form-select" value={histOrder} onChange={e => setHistOrder(e.target.value)}>
                <option value="DESC">Mais recente</option>
                <option value="ASC">Mais antigo</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="histSearch">Buscar</label>
              <input id="histSearch" className="form-control" value={histSearch} onChange={e => setHistSearch(e.target.value)} placeholder="Observações ou responsável" />
            </div>
          </div>
          <div className="d-flex gap-2 mb-3">
            <Button variant="primary" onClick={() => carregarHistorico(histProduto?.id)} disabled={histLoading}>
              {histLoading ? 'Carregando...' : 'Aplicar Filtros'}
            </Button>
            <Button variant="outline-secondary" onClick={() => { setHistStartDate(''); setHistEndDate(''); setHistSearch(''); setHistOrder('DESC'); setHistPage(1); carregarHistorico(histProduto?.id); }}>Limpar</Button>
            <Button variant="outline-success" onClick={exportarCSV} title="Exportar CSV">Exportar CSV</Button>
            <Button variant="outline-dark" onClick={exportarPDF} title="Exportar PDF">Exportar PDF</Button>
          </div>

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
                    <td>{new Date(m.data_hora).toLocaleString()}</td>
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