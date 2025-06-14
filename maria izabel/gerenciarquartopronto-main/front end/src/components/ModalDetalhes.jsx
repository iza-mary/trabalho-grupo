import { Modal, Button } from "react-bootstrap";

const ModalDetalhes = ({ show, onHide, quarto }) => {
  const observacao = quarto?.observacao?.trim();

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Observações do Quarto</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center py-2">
          {observacao ? (
            <p className="fs-5 text-dark fw-medium border rounded p-3 bg-light">
              {observacao}
            </p>
          ) : (
            <p className="fs-5 text-muted">Sem observações registradas para este quarto.</p>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fechar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalDetalhes;
