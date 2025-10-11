import { Button, Card, Col, Form, Row, Alert, Modal } from "react-bootstrap";
import SelectEvento from "../Shared/SelectEvento";
import SelectIdoso from "../Shared/SelectIdoso";
import { useEffect, useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import SelectDoador from "./SelectDoador";
import './EditarAlim.css'

function FormEditarAlim({ show, doacaoEdit, onEdit }) {

function FormEditarAlim ( {show, doacao, onEdit} ) {

    const [doaAlimentos , setDoaAlimentos] = useState({
        id: 0,
        data: "",
        tipo: "alimento",
        item: "-",
        valorquantidade: "",
        destinatario: "",
        doador: "",
        telefone: "",
        evento: "",
        obs: ""
    })

  const [validated, setValidated] = useState(false);
  const [errors, setErrors] = useState({});
  const [showAlert, setShowAlert] = useState(false);
  const [showModal, setShowModal] = useState(true);

    useEffect(() => {
        setDoaAlimentos({
            id: parseInt(doacao.id),
            data: doacao.data.substring(0, 10),
            tipo: doacao.tipo,
            item: doacao.item,
            valorquantidade: (doacao.valorQuantidade !== undefined && doacao.valorQuantidade !== "") ? parseInt(doacao.valorQuantidade, 10) : "",
            destinatario: doacao.destinatario,
            doador: doacao.doador || "",
            telefone: doacao.telefone || "",
            evento: doacao.evento || "",
            obs: doacao.obs || ""
        })
    }, [doacao]);

  const handleChangleData = (e) => {
    const value = e.target.value;
    setDoaAlimentos(prev => ({ ...prev, data: value }))
    if (value && new Date(value) < new Date()) {
      setErrors((prev) => ({ ...prev, data: null }));
    } else {
      if (value === "") {
        setErrors((prev) => ({ ...prev, data: "A data deve ser preenchida" }));
        setValidated(false);
      } else {
        setErrors((prev) => ({ ...prev, data: "A data não pode ser maior do que hoje" }))
        setValidated(false);
      }
    }
  }

  const handleChangeItem = (e) => {
    const value = e.target.value.replace(/[^\p{L}\s]/gu, '');
    setDoaAlimentos(prev => ({
      ...prev, doacao: {
        ...prev.doacao,
        item: value
      }
    }))
    if (value && isNaN(value)) {
      setErrors((prev) => ({ ...prev, item: null }));
    } else {
      if (value === "") {
        setErrors((prev) => ({ ...prev, item: "O item doado deve ser preenchido" }));
        setValidated(false);
      } else if (!isNaN(value)) {
        setErrors((prev) => ({ ...prev, item: "O item doado deve ser um texto válido" }));
        setValidated(false);
      }
    }
  }

  const handleChangeQuantidade = (e) => {
    const value = e.target.value.replace(/[a-zA-Z]/g, '');
    const numeric = value === "" ? "" : parseInt(value, 10);
    setDoaAlimentos(prev => ({ ...prev, valorquantidade: numeric }))
    if (value && !isNaN(value) && parseInt(value) >= 0) {
      setErrors((prev) => ({ ...prev, quantidade: null }));
    } else {
      if (value === "") {
        setErrors((prev) => ({ ...prev, quantidade: "A quantidade deve ser preenchida" }));
        setValidated(false);
      } else {
        if (isNaN(value) || parseInt(value) < 0) {
          setErrors((prev) => ({ ...prev, quantidade: "Quantidade inválida" }));
          setValidated(false);
        }
      }
    }
  }

  const handleChangeDescricao = (e) => {
    const value = e.target.value;
    setDoaAlimentos(prev => ({ ...prev, obs: value }))
    if (value && isNaN(value)) {
      setErrors((prev) => ({ ...prev, obs: null }));
    } else {
      if (value === "") {
        setErrors((prev) => ({ ...prev, obs: "A descrição deve ser preenchida" }));
        setValidated(false);
      } else if (!isNaN(value)) {
        setErrors((prev) => ({ ...prev, obs: "A descrição deve ser um texto válido" }));
        setValidated(false);
      }
    }
  }

  const handleChangeDoador = (e) => {
    const value = e.target.value.replace(/[0-9]/g, '');
    setDoaAlimentos(prev => ({ ...prev, doador: value }))
  }

  const handleChangeTelefone = (e) => {
    const value = e.target.value;
    const numeros = value.replace(/\D/g, '');

    let formatado = value; // valor padrão: sem reformatar

    if (e.nativeEvent.inputType !== 'deleteContentBackward') {
      if (numeros.length <= 10) {
        // (XX) XXXX-XXXX
        formatado = numeros.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
      } else {
        // (XX) 9XXXX-XXXX
        formatado = numeros.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
      }
    }

    if (!formatado) {
      setErrors(prev => ({ ...prev, telefone: null }));
    }
    else if (formatado.length !== 15 && formatado.length !== 14) {
      setErrors(prev => ({ ...prev, telefone: "Telefone inválido" }));
      setValidated(false);
    }
    else {
      setErrors(prev => ({ ...prev, telefone: null }));
    }

    setDoaAlimentos(prev => ({
      ...prev,
      telefone: formatado
    }));
  }

  

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    let newErrors = {};
    if (!form.checkValidity()) {
      e.stopPropagation();
    }

    if (!doaAlimentos.data) {
      newErrors.data = "A data deve ser preenchida";
      setValidated(false);
    } else if (new Date(doaAlimentos.data) > new Date()) {
      newErrors.data = "A data não pode ser maior do que hoje";
      setValidated(false);
    }
    if (!doaAlimentos.doacao.item) {
      newErrors.item = "O item doado deve ser preenchido";
      setValidated(false);
    } else if (!isNaN(doaAlimentos.doacao.item)) {
      newErrors.item = "O item doado deve ser um texto válido";
      setValidated(false);
    }
    if (!doaAlimentos.doacao.qntd) {
      newErrors.quantidade = "A quantidade deve ser preenchida";
      setValidated(false);
    } else if (isNaN(doaAlimentos.doacao.qntd) || parseInt(doaAlimentos.doacao.qntd) < 0) {
      newErrors.quantidade = "Quantidade inválida";
      setValidated(false);
    }
    if (!doaAlimentos.obs) {
      newErrors.obs = "A descrição deve ser preenchida";
      setValidated(false);
    } else if (!isNaN(doaAlimentos.obs)) {
      newErrors.obs = "A descrição deve ser um texto válido";
      setValidated(false);
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      setErrors({});
      onEdit(doaAlimentos)
      setValidated(true);
      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
      }, 3000);
    };
  }

  return (
    <Modal
      show={showModal}
      onHide={() => { setShowModal(false), show(true) }}
      dialogClassName="modal-90w"
      aria-labelledby="example-custom-modal-styling-title">
      <Modal.Header closeButton>
        <Modal.Title id="example-custom-modal-styling-title">
          Editar Doação
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
      <Alert variant="success" show={showAlert}> <b> <FaCheckCircle></FaCheckCircle> </b> Doação atualizada com sucesso! </Alert>
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title className="mb-4"><h5>Informações da Doação</h5></Card.Title>
              <Form.Group className="mb-3" >
                <Form.Label>Data da Doação</Form.Label>
                <Form.Control type="date" name="data" onChange={handleChangleData}
                  value={doaAlimentos.data || ""}
                  isInvalid={!!errors.data}
                  required />
                <Form.Control.Feedback type="invalid">
                  {errors.data}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Item Doado</Form.Label>
                <Form.Control name="item" onChange={handleChangeItem}
                  value={doaAlimentos.item || ""}
                  isInvalid={!!errors.item}
                  type="text" required />
                <Form.Control.Feedback type="invalid">
                  {errors.item}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Quantidade</Form.Label>
                <Form.Control name="quantidade" onChange={handleChangeQuantidade}
                  value={doaAlimentos.valorquantidade || ""}
                  isInvalid={!!errors.quantidade}
                  type="number" required />
                <Form.Control.Feedback type="invalid">
                  {errors.quantidade}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Observações/Descrição</Form.Label>
                <Form.Control
                  onChange={handleChangeDescricao}
                  value={doaAlimentos.obs || ""}
                  isInvalid={!!errors.obs}
                  name="obs" as="textarea" rows={3} />
                <Form.Control.Feedback type="invalid">
                  {errors.obs}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <SelectIdoso
                  setIdoso={(idosoSel) => setDoaAlimentos(prev => ({ ...prev, destinatario: idosoSel?.nome || "" }))}
                  setErrors={setErrors}
                  setValidated={setValidated}
                  errors={errors}
                  errorKey="destinatario"
                  selectedIdosoEdit={doaAlimentos.destinatario ? { id: 0, nome: doaAlimentos.destinatario } : null}
                />
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title className="mb-4"><h5>Informações do Doador</h5></Card.Title>
              <Form.Group className="mb-3">
                <Form.Label>Nome do Doador (Opcional)</Form.Label>
                <Form.Control name="doador" type="text"
                  onChange={handleChangeDoador}
                  value={doaAlimentos.doador || ""}
                />
              </Form.Group>
              <Form.Group controlId="telefone" className="mb-3">
                <Form.Label>Telefone para Contato (Opcional)</Form.Label>
                <Form.Control name="telefone"
                  onChange={handleChangeTelefone}
                  value={doaAlimentos.telefone || ""}
                  maxLength={15}
                  isInvalid={!!errors.telefone}
                  type="tel" />
                  <Form.Control.Feedback type="invalid">
                  {errors.telefone}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <SelectEvento
                  setEvento={(eventoTitulo) => setDoaAlimentos(prev => ({ ...prev, evento: eventoTitulo }))}
                  setErrors={setErrors}
                  setValidated={setValidated}
                  errors={errors}
                  selectedEventoEdit={doaAlimentos.evento}
                />
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" type="button" onClick={() => {setShowModal(false), show(true)}}>Cancelar</Button>
        <Button variant="warning" style={{color: "white"}} type="submit">Atualizar Doação</Button>
      </div>
    </Form>
            </Modal.Body>
        </Modal>
    );
}

export default FormEditarAlim;