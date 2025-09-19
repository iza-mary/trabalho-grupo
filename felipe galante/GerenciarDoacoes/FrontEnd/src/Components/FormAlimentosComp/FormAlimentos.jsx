import { Card, Col, Row, Form, Button, Alert } from "react-bootstrap";
import { useState } from "react";
import { FaCheckCircle } from "react-icons/fa";

function FormAlimentos({ onSave }) {

  // Estados
  const [doaAlimentos, setDoaAlimentos] = useState({
    data: "",
    tipo: "alimento",
    item: "",
    valorquantidade: "",
    destinatario: "",
    doador: "",
    telefone: "",
    evento: "",
    obs: ""
  });

  const [validated, setValidated] = useState(false);
  const [errors, setErrors] = useState({});
  const [showAlert, setShowAlert] = useState(false);
  // Funções de manipulação de eventos

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
    setDoaAlimentos(prev => ({ ...prev, item: value }))
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
    setDoaAlimentos(prev => ({ ...prev, valorquantidade: parseInt(value) }))
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
  const handleChangeDestinatario = (e) => {
    const value = e.target.value;
    setDoaAlimentos(prev => ({ ...prev, destinatario: value }))
    if (value && isNaN(value)) {
      setErrors((prev) => ({ ...prev, destinatario: null }));
    } else {
      if (value === "") {
        setErrors((prev) => ({ ...prev, destinatario: "Por favor, selecione um destinatário" }));
        setValidated(false);
      }
    }
  }

  const handleChangeDoador = (e) => {
    const value = e.target.value.replace(/[^\p{L}\s]/gu, '');
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

  const handleChangeEvento = (e) => {
    const value = e.target.value;
    setDoaAlimentos(prev => ({ ...prev, evento: value }))
  }

  const limpaForm = () => {
        setDoaAlimentos(prev => ({...prev, data: "", valorquantidade: "", item : "",
            destinatario: "", doador: "", telefone: "", evento: "", obs: ""
        }))
        setErrors({});
        setValidated(false);
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
    if (!doaAlimentos.item) {
      newErrors.item = "O item doado deve ser preenchido";
      setValidated(false);
    } else if (!isNaN(doaAlimentos.item)) {
      newErrors.item = "O item doado deve ser um texto válido";
      setValidated(false);
    }
    if (!doaAlimentos.valorquantidade) {
      newErrors.quantidade = "A quantidade deve ser preenchida";
      setValidated(false);
    } else if (isNaN(doaAlimentos.valorquantidade) || parseInt(doaAlimentos.valorquantidade) < 0) {
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
    if (!doaAlimentos.destinatario) {
      newErrors.destinatario = "Por favor, selecione um destinatário";
      setValidated(false);
    }
    if (doaAlimentos.telefone.length !== 15 && doaAlimentos.telefone.length !== 14 && doaAlimentos.telefone !== "") {
      newErrors.telefone = "Telefone inválido"
      setValidated(false);
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      setErrors({});
      onSave(doaAlimentos);
      setValidated(true);
      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
      }, 3000);
    };
  }



  return (
    // Formulário comum
    <Form noValidate validated={validated} onSubmit={handleSubmit}>
      <Alert variant="success" show={showAlert}> <b> <FaCheckCircle></FaCheckCircle> </b> Doação cadastrada com sucesso! </Alert>
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
                <Form.Label>Destinatário</Form.Label>
                <Form.Select name="destinatario" onChange={handleChangeDestinatario}
                  value={doaAlimentos.destinatario || ""}
                  isInvalid={!!errors.destinatario}
                  required>
                  <option value="">Selecione o Destinatário</option>
                  <option >Instituição (Asilo Vicentino)</option>
                  <option >João da Silva (Quarto 12)</option>
                  <option >Maria Oliveira (Quarto 8)</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.destinatario}
                </Form.Control.Feedback>
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
                <Form.Label>Evento Relacionado (Opcional)</Form.Label>
                <Form.Select
                  onChange={handleChangeEvento}
                  value={doaAlimentos.evento || ""}
                  name="evento">
                  <option value="">Nenhum evento relacionado</option>
                  <option >Bazar Beneficente - Abril 2023</option>
                  <option >Campanha do Agasalho 2023</option>
                </Form.Select>
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" type="button" onClick={() => {limpaForm()}}>Limpar</Button>
        <Button variant="primary" type="submit">Registrar Doação</Button>
      </div>
    </Form>
  );
}

export default FormAlimentos;