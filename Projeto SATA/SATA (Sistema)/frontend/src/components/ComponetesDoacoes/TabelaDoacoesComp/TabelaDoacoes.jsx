import React, { useRef, useState } from 'react';
import { Button, Card, Modal } from 'react-bootstrap';
import { BiPencil, BiTrash } from 'react-icons/bi';
import StandardTable from '../../ui/StandardTable';
import { useAuth } from '../../../hooks/useAuth';
import { formatDate } from '../../../utils/dateUtils';

function TabelaDoacoes({ doacoes, doacoesApp, onEdit, onDelete, handleDelete, editando, loaderRef: externalLoaderRef, showDelete: externalShowDelete, setShowDelete: externalSetShowDelete }) {
  const { isAdmin } = useAuth();

  // Compatibilidade com props antigas da página Doacoes.jsx
  const items = Array.isArray(doacoes) ? doacoes : (Array.isArray(doacoesApp) ? doacoesApp : []);
  const [showDelete, setShowDelete] = useState(Boolean(externalShowDelete));
  const [doacaoParaExcluir, setDoacaoParaExcluir] = useState(null);
  const internalLoaderRef = useRef(null);
  const loaderRef = externalLoaderRef ?? internalLoaderRef;
  const doDelete = onDelete || handleDelete;

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

  return (
    <Card>
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
                  <th>Item</th>
                  <th>Tipo</th>
                  <th>Valor/Quant</th>
                  <th>Idoso</th>
                  <th>Doador</th>
                  <th>Evento</th>
                  <th>Desc/Obs</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((d) => (
                  <tr key={d.id}>
                    <td>{formatDate(d.data)}</td>
                    <td>{d?.doacao?.item ?? d?.item ?? '-'}</td>
                    <td>{d?.tipo ?? '-'}</td>
                    <td>{
                      String(d?.tipo || '').toUpperCase() === 'D'
                        ? (d?.doacao?.valor ?? d?.valor ?? '-')
                        : ((d?.doacao?.qntd ?? d?.quantidade) != null
                            ? `${d?.doacao?.qntd ?? d?.quantidade} ${d?.doacao?.unidade_medida ?? d?.unidade_medida ?? ''}`
                            : '-')
                    }</td>
                    <td>{d?.idoso ?? '-'}</td>
                    <td>{d?.doador?.nome ?? d?.doador_nome ?? '-'}</td>
                    <td>{d?.evento ?? d?.evento_titulo ?? '-'}</td>
                    <td>{d?.obs ?? '-'}</td>
                    <td>
                      <div className='botoes-acao d-flex'>
                        <Button
                          className={`action-btns me-1 ${!isAdmin ? 'disabled-action' : ''}`}
                          title={!isAdmin ? 'Apenas Administradores podem editar' : 'Editar'}
                          size='sm'
                          onClick={!isAdmin ? undefined : () => { onEdit?.(d); editando?.(false); }}
                          variant='outline-primary'
                          disabled={!isAdmin}
                        >
                          <BiPencil />
                        </Button>
                        <Button
                          className={`action-btns ${!isAdmin ? 'disabled-action' : ''}`}
                          title={!isAdmin ? 'Apenas Administradores podem excluir' : 'Excluir'}
                          size='sm'
                          onClick={!isAdmin ? undefined : () => abrirModalExclusao(d)}
                          variant='outline-danger'
                          disabled={!isAdmin}
                        >
                          <BiTrash />
                        </Button>
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