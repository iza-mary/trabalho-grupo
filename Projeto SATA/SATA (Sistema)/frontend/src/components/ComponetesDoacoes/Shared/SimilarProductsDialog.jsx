import { useMemo, useState } from 'react';
import { Modal, Button, ListGroup, Form, Alert } from 'react-bootstrap';

function SimilarProductsDialog({ show, onClose, options = [], itemName = '', onConfirm }) {
  const [selectedId, setSelectedId] = useState(null);
  const [newName, setNewName] = useState(itemName || '');
  const [error, setError] = useState('');
  const normalized = useMemo(() => Array.isArray(options) ? options : [], [options]);

  const handleConfirm = () => {
    setError('');
    if (selectedId === '__no_link__') {
      const original = String(itemName || '').trim();
      const candidate = String(newName || '').trim();
      if (!candidate) {
        setError('Informe um novo nome para não vincular.');
        return;
      }
      if (candidate.toLowerCase() === original.toLowerCase()) {
        setError('O novo nome deve ser diferente do atual.');
        return;
      }
      onConfirm?.(null, candidate);
      setSelectedId(null);
      return;
    }
    onConfirm?.(selectedId || null, null);
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
        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>
        )}
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
            <ListGroup.Item>
              <div className="mb-2">
                <Form.Check
                  type="radio"
                  name="produtoSimilar"
                  id="no_link_option"
                  checked={selectedId === '__no_link__'}
                  onChange={() => setSelectedId('__no_link__')}
                  label="Não vincular (vou alterar o nome)"
                />
              </div>
              <Form.Control
                type="text"
                placeholder="Novo nome do item"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={selectedId !== '__no_link__'}
              />
              <small className="text-muted">Para não vincular, escolha esta opção e informe um nome diferente.</small>
            </ListGroup.Item>
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
