import { Card, Col, Row, Form, Button, Alert } from "react-bootstrap";
import { useEffect,useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import SelectDoador from "./SelectDoador";

function FormOutros({ onSave }) {

  // Estados
  const [doaOutros, setDoaOutros] = useState({
    data: "",
    tipo: "O",
    doador: {
      doadorId: 0,
      nome: ""
    },
    evento: "",
    obs: "",
    doacao: {
      item: "",
      qntd: ""
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
      setDoaOutros(prev => ({
        ...prev, doador: { doadorId: selectedDoador.doadorId, nome: selectedDoador.nome }
      }))
    }, [selectedDoador])

  // Funções de manipulação de eventos
  const handleChangleData = (e) => {
    const value = e.target.value;
    setDoaOutros(prev => ({ ...prev, data: value }))
    if (value && new Date(value) < new Date()) {
      setErrors((prev) => ({ ...prev, data: null }));
    } else {
      if (value === "") {
        setErrors((prev) => ({ ...prev, data: "A data deve ser preenchida" }));
        setValidated(false);
      } else if (new Date(value) > new Date()) {
        setErrors((prev) => ({ ...prev, data: "A data não pode ser maior do que hoje" }))
        setValidated(false);
      }
    }
  };

  const handleChangeItem = (e) => {
    const value = e.target.value.replace(/[^\p{L}\s]/gu, '');
    setDoaOutros(prev => ({ ...prev, doacao: {...prev.doacao, item: value}  }))
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
    setDoaOutros(prev => ({ ...prev, doacao: {...prev.doacao, qntd: value} }))
    if (value && !isNaN(value) && value > 0) {
      setErrors((prev) => ({ ...prev, quantidade: null }));
    } else {
      if (value === "") {
        setErrors((prev) => ({ ...prev, quantidade: "A quantidade deve ser preenchida" }));
        setValidated(false);
      } else if (isNaN(value) || value <= 0) {
        setErrors((prev) => ({ ...prev, quantidade: "Quantidade inválida" }));
        setValidated(false);
      }
    }
  }

  const handleChangeDescricao = (e) => {
    const value = e.target.value;
    setDoaOutros(prev => ({ ...prev, obs: value }))
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
    const value = e.target.value.replace(/[^\p{L}\s]/gu, '');
    setDoaOutros(prev => ({ ...prev, doador: value }))
  }

  const handleChangeEvento = (e) => {
    const value = e.target.value;
    setDoaOutros(prev => ({ ...prev, evento: value }));
  }

  const limpaForm = () => {
        setDoaOutros(prev => ({...prev, data: "",
            doador: {
              doadorId: 0,
              nome: ""
            },evento: "", obs: "",
            doacao : {
              item: "",
              qntd: ""
            }
        }))
        document.getElementsByName("doador")[0].value = ""
        setErrors({})
        setValidated(false);
    }

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    let newErrors = {};
    if (!form.checkValidity()) {
      e.stopPropagation();
      setValidated(true);
    }
    if (doaOutros.data === "") {
      newErrors.data = "A data deve ser preenchida";
      setValidated(false);
    } else if (new Date(doaOutros.data) > new Date()) {
      newErrors.data = "A data não pode ser maior do que hoje";
      setValidated(false);
    }
    if (doaOutros.doacao.item === "") {
      newErrors.item = "O item doado deve ser preenchido";
      setValidated(false);
    } else if (!isNaN(doaOutros.item)) {
      newErrors.item = "O item doado deve ser um texto válido";
      setValidated(false);
    }
    if (doaOutros.doacao.qntd === "") {
      newErrors.quantidade = "A quantidade deve ser preenchida";
      setValidated(false);
    } else if (isNaN(doaOutros.doacao.qntd) || doaOutros.doacao.qntd <= 0) {
      newErrors.quantidade = "Quantidade inválida";
      setValidated(false);
    }
    if (doaOutros.obs === "") {
      newErrors.obs = "A descrição deve ser preenchida";
      setValidated(false);
    } else if (!isNaN(doaOutros.obs)) {
      newErrors.obs = "A descrição deve ser um texto válido";
      setValidated(false);
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      setErrors({});
      onSave(doaOutros)
      setValidated(true);
      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false)
      }, 3000)
    }
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
                  value={doaOutros.data || ""}
                  isInvalid={!!errors.data}
                  required />
                <Form.Control.Feedback type="invalid">
                  {errors.data}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Item Doado</Form.Label>
                <Form.Control name="item" onChange={handleChangeItem}
                  value={doaOutros.doacao.item || ""}
                  isInvalid={!!errors.item}
                  type="text" required />
                <Form.Control.Feedback type="invalid">
                  {errors.item}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Quantidade</Form.Label>
                <Form.Control name="quantidade" onChange={handleChangeQuantidade}
                  value={doaOutros.doacao.qntd || ""}
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
              <Card.Title className="mb-4"><h5>Informações Adicionais</h5></Card.Title>
              <Form.Group className="mb-3">
                <Form.Label>Destinatário</Form.Label>
                <Form.Control
                  onChange={handleChangeDoador}/>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Evento Relacionado (Opcional)</Form.Label>
                <Form.Select
                  onChange={handleChangeEvento}
                  value={doaOutros.evento || ""}
                  name="evento">
                  <option value="">Nenhum evento relacionado</option>
                  <option >Bazar Beneficente - Abril 2023</option>
                  <option >Campanha do Agasalho 2023</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Observações/Descrição</Form.Label>
                <Form.Control name="descricao" onChange={handleChangeDescricao}
                  value={doaOutros.obs || ""}
                  isInvalid={!!errors.obs}
                  as="textarea" rows={3} required />
                <Form.Control.Feedback type="invalid">
                  {errors.obs}
                </Form.Control.Feedback>
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

export default FormOutros;