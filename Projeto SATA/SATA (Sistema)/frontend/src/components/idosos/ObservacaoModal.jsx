import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';

export default function ObservacaoModal({ show, onHide, onSave, idosoId, usuarioId, initialText = '', title = 'Registrar Observação' }) {
  const [observacao, setObservacao] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      setObservacao(initialText || '');
      setError('');
      setSubmitting(false);
    }
  }, [show, initialText]);

  const handleSave = async () => {
    if (!observacao.trim()) {
      setError('A observação não pode estar vazia.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onSave({
        idoso_id: idosoId,
        usuario_id: usuarioId,
        observacao: observacao,
      });
      onHide();
    } catch (err) {
      setError(err.message || 'Falha ao salvar a observação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered dialogClassName="modal-lg">
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form>
          <Form.Group controlId="formObservacao">
            <Form.Label>Observação</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Digite as observações relevantes aqui..."
              isInvalid={!!error}
            />
            <Form.Control.Feedback type="invalid">
              {error}
            </Form.Control.Feedback>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={submitting}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={submitting}>
          {submitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
