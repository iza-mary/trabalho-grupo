import { Button, Card, Col, Form, Row, Alert, Modal } from "react-bootstrap";
import SelectEvento from "../Shared/SelectEvento";
import SelectIdoso from "../Shared/SelectIdoso";
import { useEffect, useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import SelectDoador from "./SelectDoador";
import './EditarAlim.css'

function FormEditarAlim({ show, doacaoEdit, onEdit }) {

    const [doaAlimentos , setDoaAlimentos] = useState({
        id: 0,
        data: "",
        tipo: "alimento",
        doacao: {
          item: "",
          qntd: "",
          unidade_medida: "Unidade",
          validade: ""
        },
        destinatario: "",
        doador: { doadorId: 0, nome: "" },
        evento: "",
        eventoId: null,
        obs: ""
    })

  const [validated, setValidated] = useState(false);
  const [errors, setErrors] = useState({});
  const [showAlert, setShowAlert] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("Unidade(s)");
  const [unidadeOutro, setUnidadeOutro] = useState("");

    useEffect(() => {
        if (!doacaoEdit) return;
        setDoaAlimentos({
            id: parseInt(doacaoEdit.id),
            data: (doacaoEdit.data || "").substring(0, 10),
            tipo: doacaoEdit.tipo,
            doacao: {
              item: (
                doacaoEdit.doacao?.tipo_alimento ??
                doacaoEdit.tipo_alimento ??
                doacaoEdit.doacao?.item ??
                doacaoEdit.item ??
                ""
              ),
              qntd: doacaoEdit.doacao?.qntd ?? doacaoEdit.doacao?.quantidade ?? doacaoEdit.quantidade ?? "",
              unidade_medida: doacaoEdit.doacao?.unidade_medida ?? "Unidade(s)",
              validade: (doacaoEdit.doacao?.validade || doacaoEdit.validade || "").substring(0,10)
            },
            destinatario: doacaoEdit.idoso || "",
            doador: { doadorId: doacaoEdit.doador?.doadorId ?? doacaoEdit.doador?.id ?? 0, nome: doacaoEdit.doador?.nome ?? "" },
            evento: doacaoEdit.evento || "",
            eventoId: doacaoEdit.eventoId ?? null,
            obs: doacaoEdit.obs || ""
        })
    }, [doacaoEdit]);

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
    const value = e.target.value;
    setDoaAlimentos(prev => ({
      ...prev, doacao: {
        ...prev.doacao,
        item: value
      }
    }))
    if (value && String(value).trim() !== '') {
      setErrors((prev) => ({ ...prev, item: null }));
    } else {
      setErrors((prev) => ({ ...prev, item: "O item doado deve ser preenchido" }));
      setValidated(false);
    }
  }

  const handleChangeQuantidade = (e) => {
    const value = e.target.value.replace(/[a-zA-Z]/g, '');
    const numeric = value === "" ? "" : parseInt(value, 10);
    setDoaAlimentos(prev => ({ ...prev, doacao: { ...prev.doacao, qntd: numeric } }))
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

  const handleChangeUnidade = (e) => {
    const value = e.target.value;
    setUnidadeSelecionada(value);
    if (value === 'Outro') {
      setDoaAlimentos(prev => ({ ...prev, doacao: { ...prev.doacao, unidade_medida: '' } }));
    } else {
      setUnidadeOutro('');
      setDoaAlimentos(prev => ({ ...prev, doacao: { ...prev.doacao, unidade_medida: value } }));
      setErrors(prev => ({ ...prev, unidade_medida: null }));
    }
  }

  const handleChangeUnidadeOutro = (e) => {
    const value = e.target.value;
    setUnidadeOutro(value);
    setDoaAlimentos(prev => ({ ...prev, doacao: { ...prev.doacao, unidade_medida: value } }));
    if (!value || String(value).trim() === '') {
      setErrors(prev => ({ ...prev, unidade_medida: 'Informe a unidade' }));
      setValidated(false);
    } else if (!isNaN(value)) {
      setErrors(prev => ({ ...prev, unidade_medida: 'A unidade (Outro) deve ser texto válido' }));
      setValidated(false);
    } else {
      setErrors(prev => ({ ...prev, unidade_medida: null }));
    }
  }

  useEffect(() => {
    setUnidadeSelecionada(doaAlimentos?.doacao?.unidade_medida ?? 'Unidade');
  }, [doaAlimentos?.doacao?.unidade_medida]);

  const handleChangeDescricao = (e) => {
    const value = e.target.value;
    setDoaAlimentos(prev => ({ ...prev, obs: value }))
    if (value === "") {
      setErrors((prev) => ({ ...prev, obs: null }));
    } else if (!isNaN(value)) {
      setErrors((prev) => ({ ...prev, obs: "A descrição deve ser um texto válido" }));
      setValidated(false);
    } else {
      setErrors((prev) => ({ ...prev, obs: null }));
    }
  }

  // Removido: doador é selecionado via componente SelectDoador com id e nome

  // Campo de telefone removido no formulário de edição

  

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
    if (!doaAlimentos.doacao.item || String(doaAlimentos.doacao.item).trim() === '') {
      newErrors.item = "O item doado deve ser preenchido";
      setValidated(false);
    }
    if (!doaAlimentos.doacao.qntd) {
      newErrors.quantidade = "A quantidade deve ser preenchida";
      setValidated(false);
    } else if (isNaN(doaAlimentos.doacao.qntd) || parseInt(doaAlimentos.doacao.qntd) < 0) {
      newErrors.quantidade = "Quantidade inválida";
      setValidated(false);
    }
    // Doador obrigatório: exigir um doador selecionado com id válido
    const did = Number(doaAlimentos?.doador?.doadorId);
    if (!did || did <= 0) {
      newErrors.doador = "Doador é obrigatório";
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

  const handleChangeValidade = (e) => {
    const value = e.target.value;
    setDoaAlimentos(prev => ({ ...prev, doacao: { ...prev.doacao, validade: value } }));
    if (!value) {
      setErrors(prev => ({ ...prev, validade: null }));
      return;
    }
    try {
      const hoje = new Date();
      const dataVal = new Date(value);
      if (dataVal < new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())) {
        setErrors(prev => ({ ...prev, validade: 'A validade não pode ser no passado' }));
        setValidated(false);
      } else {
        setErrors(prev => ({ ...prev, validade: null }));
      }
    } catch {
      setErrors(prev => ({ ...prev, validade: 'Data de validade inválida' }));
      setValidated(false);
    }
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
        <Form noValidate validated={validated} onSubmit={handleSubmit} autoComplete="off">
      <Alert variant="success" show={showAlert}> <b> <FaCheckCircle></FaCheckCircle> </b> Doação atualizada com sucesso! </Alert>
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title className="mb-4"><h5>Informações da Doação</h5></Card.Title>
              <Form.Group className="mb-3" >
                <Form.Label>Data da Doação (Obrigatório)</Form.Label>
                <Form.Control type="date" name="data" onChange={handleChangleData} autoComplete="off"
                  value={doaAlimentos.data || ""}
                  isInvalid={!!errors.data}
                  required />
                <Form.Control.Feedback type="invalid">
                  {errors.data}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Item Doado (Obrigatório)</Form.Label>
                <Form.Control name="item" onChange={handleChangeItem} autoComplete="off"
                  value={doaAlimentos.doacao.item || ""}
                  isInvalid={!!errors.item}
                  type="text" required />
                <Form.Control.Feedback type="invalid">
                  {errors.item}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Quantidade (Somente leitura)</Form.Label>
                <Form.Control name="quantidade" onChange={handleChangeQuantidade} autoComplete="off"
                  value={doaAlimentos.doacao.qntd || ""}
                  isInvalid={!!errors.quantidade}
                  type="number" readOnly disabled title="Quantidade original da doação é imutável" />
                <Form.Control.Feedback type="invalid">
                  {errors.quantidade}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Unidade de medida (Obrigatório)</Form.Label>
                <Form.Select name="unidade_medida" value={unidadeSelecionada} onChange={handleChangeUnidade} required isInvalid={!!errors.unidade_medida}>
                  <option value="Unidade(s)">Unidade(s)</option>
                  <option value="Kg">Kg</option>
                  <option value="L">L</option>
                  <option value="Pacotes">Pacotes</option>
                  <option value="Caixas">Caixas</option>
                  <option value="m">m</option>
                  <option value="Outro">Outro</option>
                </Form.Select>
                {unidadeSelecionada === 'Outro' && (
                  <Form.Control className="mt-2" placeholder="Especifique a unidade" value={unidadeOutro} onChange={handleChangeUnidadeOutro} isInvalid={!!errors.unidade_medida} required />
                )}
                <Form.Control.Feedback type="invalid">
                  {errors.unidade_medida}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Validade (Opcional)</Form.Label>
                <Form.Control type="date" name="validade" value={doaAlimentos?.doacao?.validade || ''} onChange={handleChangeValidade} isInvalid={!!errors.validade} />
                <Form.Control.Feedback type="invalid">
                  {errors.validade}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Observações/Descrição (Opcional)</Form.Label>
                <Form.Control autoComplete="off"
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
                <SelectDoador
                  setDoador={setDoaAlimentos}
                  setErrors={setErrors}
                  setValidated={setValidated}
                  errors={errors}
                  selectedDoadorEdit={doaAlimentos.doador}
                />
              </Form.Group>
              {/* Campo de telefone removido */}
              <Form.Group className="mb-3">
                <SelectEvento
                  setEvento={(eventoTitulo) => setDoaAlimentos(prev => ({ ...prev, evento: eventoTitulo }))}
                  setEventoId={(id) => setDoaAlimentos(prev => ({ ...prev, eventoId: id }))}
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
        <Button
          variant="primary"
          type="submit"
          style={{ backgroundColor: '#007bff', borderColor: '#007bff', color: 'white' }}
        >
          Atualizar Doação
        </Button>
      </div>
    </Form>
            </Modal.Body>
        </Modal>
    );
}

export default FormEditarAlim;
