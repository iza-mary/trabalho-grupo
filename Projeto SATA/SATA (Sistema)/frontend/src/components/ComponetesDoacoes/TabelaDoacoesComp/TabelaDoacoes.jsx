import React, { useRef, useState } from 'react';
import { Button, Card, Modal } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { Pencil, Trash, Eye } from 'react-bootstrap-icons';
import ActionIconButton from '../../ui/ActionIconButton';
import StandardTable from '../../ui/StandardTable';
import { useAuth } from '../../../hooks/useAuth';
import { formatDate } from '../../../utils/dateUtils';

function TabelaDoacoes({ doacoes, doacoesApp, onEdit, onDelete, handleDelete, loaderRef: externalLoaderRef, showDelete: externalShowDelete, setShowDelete: externalSetShowDelete, printUrl, hiddenColumns = [] }) {
  const auth = useAuth();
  const isAdmin = Boolean(auth && auth.isAdmin);
  const normalizeRole = (role) => {
    if (!role) return role;
    const r = String(role).toLowerCase();
    if (r.includes('admin')) return 'Admin';
    if (r.includes('funcionario') || r.includes('funcionário')) return 'Funcionário';
    return role;
  };
  const canEdit = ['Admin','Funcionário'].includes(normalizeRole(auth?.user?.role));
  const navigate = useNavigate();
  const location = useLocation();

  // Compatibilidade com props antigas da página Doacoes.jsx
  const items = Array.isArray(doacoes) ? doacoes : (Array.isArray(doacoesApp) ? doacoesApp : []);
  const [showDelete, setShowDelete] = useState(Boolean(externalShowDelete));
  const [doacaoParaExcluir, setDoacaoParaExcluir] = useState(null);
  const internalLoaderRef = useRef(null);
  const loaderRef = externalLoaderRef ?? internalLoaderRef;
  const doDelete = onDelete || handleDelete;
  const isHidden = (key) => Array.isArray(hiddenColumns) && hiddenColumns.includes(key);

  const abrirModalExclusao = (d) => {
    setDoacaoParaExcluir(d);
    setShowDelete(true);
    externalSetShowDelete?.(true);
  };

  const fecharModalExclusao = () => {
    setShowDelete(false);
    externalSetShowDelete?.(false);
    setDoacaoParaExcluir(null);
  };

  const confirmarExclusao = async () => {
    if (!isAdmin) return;
    if (!doacaoParaExcluir) return;
    try {
      await doDelete?.(doacaoParaExcluir);
    } finally {
      fecharModalExclusao();
    }
  };

  const renderItemName = (d) => {
    const tipo = String(d?.tipo || '').toUpperCase();
    if (tipo === 'D' || tipo === 'DINHEIRO') return 'Doação em dinheiro';
    const itemCandidate = d?.doacao?.descricao_item
      ?? d?.descricao_item
      ?? d?.doacao?.tipo_alimento
      ?? d?.tipo_alimento
      ?? d?.doacao?.item
      ?? d?.item
      ?? null;
    return itemCandidate ? itemCandidate : '—';
  }

  const isAlimento = (d) => {
    const t = String(d?.tipo || '').toUpperCase();
    return t === 'A' || t === 'ALIMENTO';
  };
  // Categoria e Estado (para exibição)
  const renderCategoria = (d) => {
    const t = String(d?.tipo || '').toUpperCase();
    if (t === 'D' || t === 'DINHEIRO') {
      const v = d?.doacao?.valor ?? d?.valor;
      const n = Number(v);
      return Number.isFinite(n) ? `Dinheiro - R$ ${n.toFixed(2)}` : 'Dinheiro';
    }
    // Deriva pela presença dos campos quando tipo não está padronizado
    if (t === 'A' || t === 'ALIMENTO' || d?.doacao?.tipo_alimento || d?.tipo_alimento) return 'Alimento';
    if (t === 'O' || t === 'OUTROS' || d?.doacao?.descricao_item || d?.descricao_item || d?.doacao?.item || d?.item) return 'Outros';
    // Fallback: usa 'Outros' para manter compatível com enum
    return 'Outros';
  };

  const renderEstado = (d) => {
    // Exibe estado de conservação sempre que disponível
    return d?.doacao?.estado_conservacao ?? '—';
  };

  // Coluna Tipo removida da tabela; Categoria já reflete o tipo

  // Ordenação e filtros (removidos)
  const filteredItems = items;

  const renderValorQuant = (d) => {
    const tipo = String(d?.tipo || '').toUpperCase();
    if (tipo === 'D' || tipo === 'DINHEIRO') {
      const v = d?.doacao?.valor ?? d?.valor ?? 0;
      const n = Number(v);
      return isNaN(n) ? 'R$ 0.00' : `R$ ${n.toFixed(2)}`;
    }
    const q = d?.doacao?.quantidade ?? d?.doacao?.qntd ?? d?.quantidade ?? d?.qntd ?? 0;
    const un = d?.doacao?.unidade_medida ?? d?.unidade_medida ?? 'Unidade(s)';
    return `${q} ${un}`.trim();
  }

  

  return (
    <Card>
      <Card.Header className="d-flex align-items-center justify-content-between">
        <h5 className="mb-0">Doações</h5>
        <Button variant="outline-secondary" onClick={() => navigate(printUrl || '/doacoes/impressao')}>
          Imprimir
        </Button>
      </Card.Header>
      <Card.Body>
        <div className="table-responsive">
          {items.length === 0 ? (
            <div className='text-center p-4'>
              <p className='text-muted'>Nenhuma doação encontrada</p>
            </div>
          ) : (
            <StandardTable>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th>Estado</th>
                  <th>Valor/Quant</th>
                  {!isHidden('validade') && <th>Validade</th>}
                  {!isHidden('idoso') && <th>Idoso</th>}
                  <th>Doador</th>
                  <th>Evento</th>
                  {!isHidden('obs') && <th>Desc/Obs</th>}
                  <th>Ações</th>
                </tr>
                
                
              </thead>
              <tbody>
                {filteredItems.map((d) => (
                  <tr key={d.id} title={(renderItemName(d) || renderCategoria(d))} aria-label={`Doação — ${(renderItemName(d) || renderCategoria(d))}`}>
                    <td>{formatDate(d.data)}</td>
                    <td>{renderItemName(d)}</td>
                    <td>{renderCategoria(d)}</td>
                    <td>{renderEstado(d)}</td>
                    <td>{renderValorQuant(d)}</td>
                    {!isHidden('validade') && <td>{isAlimento(d) ? (d?.doacao?.validade ? formatDate(d?.doacao?.validade) : '—') : '—'}</td>}
                    {!isHidden('idoso') && <td>{d?.idoso ?? '-'}</td>}
                    <td>{d?.doador?.nome ?? d?.doador_nome ?? '-'}</td>
                    <td>{d?.evento ?? d?.evento_titulo ?? '-'}</td>
                    {!isHidden('obs') && <td>{d?.obs ?? '-'}</td>}
                    <td>
                      <div className='botoes-acao'>
                        <ActionIconButton
                          title={'Detalhes'}
                          size='sm'
                          onClick={() => navigate(`/doacoes/detalhes/${d.id}`)}
                          variant='outline-secondary'
                          ariaLabel={`Abrir ficha da doação ${d.id}`}
                        >
                          <Eye />
                        </ActionIconButton>
                        <ActionIconButton
                          className={!canEdit ? 'disabled-action' : undefined}
                          title={!canEdit ? 'Sem permissão para editar' : 'Editar'}
                          size='sm'
                          onClick={!canEdit ? undefined : () => { if (typeof onEdit === 'function') { onEdit(d); } else { navigate(`/doacoes/editar/${d.id}`, { state: { background: location } }); } }}
                          variant='outline-primary'
                          disabled={!canEdit}
                          ariaLabel={!canEdit ? 'Sem permissão para editar' : 'Editar doação'}
                        >
                          <Pencil />
                        </ActionIconButton>
                        <ActionIconButton
                          className={!isAdmin ? 'disabled-action' : undefined}
                          title={!isAdmin ? 'Apenas Administradores podem excluir' : 'Excluir'}
                          size='sm'
                          onClick={!isAdmin ? undefined : () => abrirModalExclusao(d)}
                          variant='outline-danger'
                          disabled={!isAdmin}
                          ariaLabel={!isAdmin ? 'Apenas Administradores podem excluir' : 'Excluir doação'}
                        >
                          <Trash />
                        </ActionIconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </StandardTable>
          )}
          {/* Sentinel de carregamento contínuo */}
          <div ref={loaderRef} style={{ height: '1px' }} aria-hidden="true"></div>

          <Modal show={showDelete} onHide={fecharModalExclusao}>
            <Modal.Header closeButton>
              <Modal.Title>Confirmar Exclusão</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              Tem certeza que deseja excluir esta doação?
            </Modal.Body>
            <Modal.Footer>
              <Button variant='secondary' onClick={fecharModalExclusao}>Cancelar</Button>
              <Button
                variant='danger'
                onClick={!isAdmin ? undefined : confirmarExclusao}
                disabled={!isAdmin}
                title={!isAdmin ? 'Apenas Administradores podem confirmar exclusão' : 'Excluir'}
                className={!isAdmin ? 'disabled-action' : ''}
              >
                Excluir
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </Card.Body>
    </Card>
  );
}

export default TabelaDoacoes;
