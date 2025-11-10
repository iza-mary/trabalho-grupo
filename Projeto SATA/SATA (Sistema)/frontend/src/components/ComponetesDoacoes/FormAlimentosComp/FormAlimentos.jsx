import { Card, Col, Row, Form, Button, Alert } from "react-bootstrap";
import { useEffect, useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { BiPlusCircle } from "react-icons/bi";
import SelectDoador from "./SelectDoador";
import SelectIdoso from "../Shared/SelectIdoso";
import SelectEvento from "../Shared/SelectEvento";
import SimilarProductsDialog from "../Shared/SimilarProductsDialog";
import donationStockService from "../../../services/donationStockService";

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
    eventoId: null,
    obs: "",
    doacao: {
      item: "",
      qntd: 0,
      unidade_medida: "Unidade"
    }
  });

  const [validated, setValidated] = useState(false);
  const [errors, setErrors] = useState({});
  const [showAlert, setShowAlert] = useState(false);
  const [selectedDoador, setSelectedDoador] = useState({
    doadorId: 0,
    nome: ""
  });
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("Unidade");
  const [unidadeOutro, setUnidadeOutro] = useState("");
  const [showSimilarDialog, setShowSimilarDialog] = useState(false);
  const [similarOptions, setSimilarOptions] = useState([]);
  const [pendingSubmission, setPendingSubmission] = useState(null);

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
    const value = e.target.value;
    setDoaAlimentos(prev => ({ ...prev, doacao: { ...prev.doacao, item: value } }))
    if (value && String(value).trim() !== '') {
      setErrors((prev) => ({ ...prev, item: null }));
    } else {
      setErrors((prev) => ({ ...prev, item: "O item doado deve ser preenchido" }));
      setValidated(false);
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
        eventoId: null,
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

  const handleSubmit = async (e) => {
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
    // Doador é obrigatório: exigir um doador selecionado com id válido
    const did = Number(doaAlimentos?.doador?.doadorId);
    if (!did || did <= 0) {
      newErrors.doador = "Doador é obrigatório";
      setValidated(false);
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      setErrors({});
      // Buscar similares antes de salvar
      try {
        const similares = await donationStockService.buscarSimilares(
          doaAlimentos?.doacao?.item ?? '',
          'Alimentos'
        );
        if (Array.isArray(similares) && similares.length > 0) {
          setSimilarOptions(similares);
          setPendingSubmission(doaAlimentos);
          setShowSimilarDialog(true);
          return;
        }
      } catch (err) {
        console.warn('Falha ao buscar similares, prosseguindo com cadastro.', err?.message || err);
      }

      onSave(doaAlimentos);
      setValidated(true);
      setShowAlert(true);
      limpaForm();
      setTimeout(() => { setShowAlert(false); }, 3000);
    }
  }

  const handleConfirmSimilar = (produtoId) => {
    const submission = { ...(pendingSubmission || doaAlimentos) };
    if (produtoId) {
      submission.doacao = { ...(submission.doacao || {}), produto_id: produtoId };
    }
    onSave(submission);
    setShowSimilarDialog(false);
    setPendingSubmission(null);
    setValidated(true);
    setShowAlert(true);
    limpaForm();
    setTimeout(() => { setShowAlert(false); }, 3000);
  };



  return (
    <>
    {/* Formulário comum */}
    <Form noValidate validated={validated} onSubmit={handleSubmit} autoComplete="off">
      <Alert variant="success" show={showAlert}> <b> <FaCheckCircle></FaCheckCircle> </b> Doação cadastrada com sucesso! </Alert>
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title className="mb-4"><h5>Informações da Doação</h5></Card.Title>
              <Form.Group className="mb-3" >
                <Form.Label>Data da Doação</Form.Label>
                <Form.Control type="date" name="data" onChange={handleChangleData} autoComplete="off"
                  value={doaAlimentos.data || ""}
                  isInvalid={!!errors.data}
                  required />
                <Form.Control.Feedback type="invalid">
                  {errors.data}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Item Doado</Form.Label>
                <Form.Control name="item" onChange={handleChangeItem} autoComplete="off"
                  value={doaAlimentos.doacao.item || ""}
                  isInvalid={!!errors.item}
                  type="text" required />
                <Form.Control.Feedback type="invalid">
                  {errors.item}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Quantidade</Form.Label>
                <Form.Control name="quantidade" onChange={handleChangeQuantidade} autoComplete="off"
                  value={doaAlimentos.doacao.qntd || ""}
                  isInvalid={!!errors.quantidade}
                  type="number" required />
                <Form.Control.Feedback type="invalid">
                  {errors.quantidade}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Unidade de medida (Obrigatório)</Form.Label>
                <Form.Select value={unidadeSelecionada} onChange={handleChangeUnidade} required isInvalid={!!errors.unidade_medida}>
                  <option value="Unidade">Unidade</option>
                  <option value="Kg">Kg</option>
                  <option value="L">L</option>
                  <option value="Pacote">Pacote</option>
                  <option value="Caixa">Caixa</option>
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
                  setEventoId={(id) => setDoaAlimentos(prev => ({ ...prev, eventoId: id }))}
                  setErrors={setErrors}
                  setValidated={setValidated}
                  errors={errors}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Observações/Descrição</Form.Label>
                <Form.Control autoComplete="off"
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
    <SimilarProductsDialog
      show={showSimilarDialog}
      onClose={() => { setShowSimilarDialog(false); setPendingSubmission(null); }}
      options={similarOptions}
      itemName={doaAlimentos?.doacao?.item || ''}
      onConfirm={handleConfirmSimilar}
    />
    </>
  );
}

export default FormAlimentos;