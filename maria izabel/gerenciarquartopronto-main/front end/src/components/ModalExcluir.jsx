import { Modal, Button } from "react-bootstrap";

const ModalExcluir = ({ show, onHide, onConfirm }) => {
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Confirmar Exclusão</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Tem certeza que deseja excluir este quarto? Esta ação não poderá ser desfeita.
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Excluir
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalExcluir;
