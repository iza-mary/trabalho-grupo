import { useMemo, useState } from 'react';
import { Modal, Button, ListGroup, Form } from 'react-bootstrap';

function SimilarProductsDialog({ show, onClose, options = [], itemName = '', onConfirm }) {
  const [selectedId, setSelectedId] = useState(null);
  const normalized = useMemo(() => Array.isArray(options) ? options : [], [options]);

  const handleConfirm = () => {
    onConfirm?.(selectedId || null);
    setSelectedId(null);
  };

  const handleCancel = () => {
    onClose?.();
    setSelectedId(null);
  };

  return (
    <Modal show={show} onHide={handleCancel} backdrop="static" centered>
      <Modal.Header closeButton>
        <Modal.Title>Produtos similares encontrados</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Encontramos itens semelhantes a "{itemName}". Você deseja vincular a um produto existente?
        </p>
        {normalized.length === 0 ? (
          <div>Nenhum similar encontrado.</div>
        ) : (
          <ListGroup>
            {normalized.map((p) => (
              <ListGroup.Item key={p.id} className="d-flex align-items-center justify-content-between">
                <div>
                  <div><strong>{p.nome}</strong></div>
                  <div className="text-muted" style={{ fontSize: '0.9rem' }}>Categoria: {p.categoria || '—'}</div>
                  <div className="text-muted" style={{ fontSize: '0.9rem' }}>Estoque atual: {p.quantidade ?? p.qntd ?? 0}</div>
                </div>
                <Form.Check
                  type="radio"
                  name="produtoSimilar"
                  checked={selectedId === p.id}
                  onChange={() => setSelectedId(p.id)}
                  label="Selecionar"
                />
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCancel}>Cancelar</Button>
        <Button variant="primary" onClick={handleConfirm}>Confirmar</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default SimilarProductsDialog;