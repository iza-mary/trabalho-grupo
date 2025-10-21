import { Card, Col, Row, Form, Button, Alert } from "react-bootstrap";
import { useEffect, useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { BiPlusCircle } from "react-icons/bi";
import SelectDoador from "./SelectDoador";
import SelectIdoso from "../Shared/SelectIdoso";
import SelectEvento from "../Shared/SelectEvento";

function FormAlimentos({ onSave }) {

  // Estados
  const [doaAlimentos, setDoaAlimentos] = useState({
    data: "",
    tipo: "A",
    doador: {
      doadorId: 0,
      nome: ""
    },
    idoso: { id: 0, nome: "" },
    evento: "",
    obs: "",
    doacao: {
      item: "",
      qntd: 0
    }
  });

  const [validated, setValidated] = useState(false);
  const [errors, setErrors] = useState({});
  const [showAlert, setShowAlert] = useState(false);
  const [selectedDoador, setSelectedDoador] = useState({
    doadorId: 0,
    nome: ""
  });

  useEffect(() => {
    setDoaAlimentos(prev => ({
      ...prev, doador: { doadorId: selectedDoador.doadorId, nome: selectedDoador.nome }
    }))
  }, [selectedDoador])


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
    setDoaAlimentos(prev => ({ ...prev, doacao: {...prev.doacao, item: value} }))
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
    setDoaAlimentos(prev => ({ ...prev, doacao: {...prev.doacao, qntd: parseInt(value)}}))
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
  }

  // Removido: antigo handler de evento não utilizado após adoção do SelectEvento

  const limpaForm = () => {
    setDoaAlimentos(prev => ({
      ...prev, data: "", 
      doador: {
        doadorId: 0, 
        nome: ""
      },
        idoso: { id: 0, nome: "" },
        evento: "", 
        obs: "",
        doacao: {
          item: "",
          qntd: 0
        }
    }))
    document.getElementsByName("doador")[0].value = ""
    document.getElementsByName("idoso")[0].value = ""
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
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      setErrors({});
      onSave(doaAlimentos);
      setValidated(true);
      setShowAlert(true);
      // Limpa o formulário após registrar
      limpaForm();
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
                  value={doaAlimentos.doacao.item || ""}
                  isInvalid={!!errors.item}
                  type="text" required />
                <Form.Control.Feedback type="invalid">
                  {errors.item}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Quantidade</Form.Label>
                <Form.Control name="quantidade" onChange={handleChangeQuantidade}
                  value={doaAlimentos.doacao.qntd || ""}
                  isInvalid={!!errors.quantidade}
                  type="number" required />
                <Form.Control.Feedback type="invalid">
                  {errors.quantidade}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <SelectDoador setDoador={setSelectedDoador} setErrors={setErrors} errors={errors} setValidated={setValidated} />
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title className="mb-4"><h5>Informações Adicionais (Opcional)</h5></Card.Title>
              <Form.Group className="mb-3">
                <SelectIdoso
                  setIdoso={(idoso) => setDoaAlimentos(prev => ({ ...prev, idoso }))}
                  setErrors={setErrors}
                  setValidated={setValidated}
                  errors={errors}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <SelectEvento
                  setEvento={(eventoTitulo) => setDoaAlimentos(prev => ({ ...prev, evento: eventoTitulo }))}
                  setErrors={setErrors}
                  setValidated={setValidated}
                  errors={errors}
                />
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
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" type="button" onClick={() => { limpaForm() }}>Limpar</Button>
        <Button variant="primary" type="submit" className="d-flex align-items-center gap-2">
          <BiPlusCircle className="me-1" size={18} />
          Registrar Doação
        </Button>
      </div>
    </Form>
  );
}

export default FormAlimentos;