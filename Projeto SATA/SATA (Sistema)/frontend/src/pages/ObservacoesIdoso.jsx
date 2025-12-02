import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button, Spinner } from 'react-bootstrap';
import BotaoRegistrarObservacao from '../components/idosos/BotaoRegistrarObservacao';
import ObservacaoModal from '../components/idosos/ObservacaoModal';
import idosoService from '../services/idosoService';
import { useAuth } from '../hooks/useAuth';

import ConfirmModal from '../components/common/ConfirmModal';

export default function ObservacoesIdoso() {
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [observacoes, setObservacoes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetchObservacoes = useCallback(async () => {
    try {
      setLoading(true);
      const lista = await idosoService.getObservacoes(id);
      setObservacoes(lista);
      setError('');
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Falha ao carregar observações');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchObservacoes(); }, [fetchObservacoes]);

  const onSave = async (data) => {
    if (editing && editing.id) {
      await idosoService.updateObservacao(id, editing.id, { observacao: data.observacao });
    } else {
      await idosoService.addObservacao(id, data);
    }
    setEditing(null);
    setShowModal(false);
    await fetchObservacoes();
  };

  const handleEdit = (obs) => { setEditing(obs); setShowModal(true); };
  const handleDelete = (obs) => { setDeleting(obs); setShowConfirmModal(true); };

  const executeDelete = async () => {
    if (!deleting) return;
    try {
      await idosoService.deleteObservacao(id, deleting.id);
      await fetchObservacoes();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Falha ao excluir observação';
      alert(msg);
    } finally {
      setDeleting(null);
      setShowConfirmModal(false);
    }
  };

  if (loading) return (<div className="d-flex align-items-center justify-content-center"><Spinner animation="border" /><span className="ms-2">Carregando...</span></div>);
  if (error) return (<div className="alert alert-danger" role="alert">{error}</div>);

  return (
    <div className="page-content p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Link to={`/idosos`} className="btn btn-outline-secondary">Voltar</Link>
        <BotaoRegistrarObservacao solid label="Nova Observação" onClick={() => { setEditing(null); setShowModal(true); }} />
      </div>
      <section>
        <h3>Observações</h3>
        {Array.isArray(observacoes) && observacoes.length ? (
          <ul className="list-group">
            {observacoes.map((o) => (
              <li key={o.id} className="list-group-item">
                <div className="d-flex justify-content-between">
                  <small>{new Date(o.data_registro).toLocaleString('pt-BR')}</small>
                  <div>
                    <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => handleEdit(o)}>Editar</Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(o)}>Excluir</Button>
                  </div>
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }} className="mt-2">{o.observacao}</div>
              </li>
            ))}
          </ul>
        ) : (<p>Nenhuma observação registrada.</p>)}
      </section>

      <ObservacaoModal
        show={showModal}
        onHide={() => { setShowModal(false); setEditing(null); }}
        onSave={onSave}
        idosoId={id}
        usuarioId={user?.id}
        initialText={editing?.observacao || ''}
        title={editing ? 'Editar Observação' : 'Registrar Observação'}
      />

      <ConfirmModal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        onConfirm={executeDelete}
        title="Confirmar Exclusão"
        body="Você tem certeza que deseja excluir esta observação?"
      />
    </div>
  );
}
