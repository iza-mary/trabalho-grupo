import { Button, Card, Col, Form, Row, Alert } from "react-bootstrap";
import { useEffect, useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import SelectDoador from "./SelectDoador";

function FormDinheiro({ onSave }) {

    // Estados
    const [doaDinheiro, setDoaDinheiro] = useState({
        data: "",
        tipo: "D",
        obs: "",
        doador: "",
        evento: "",
        valor: 0
    });
    const [validated, setValidated] = useState(false);
    const [errors, setErrors] = useState({});
    const [showAlert, setShowAlert] = useState(false);
    const [selectedDoador, setSelectedDoador] = useState({
        id: "",
        nome: ""
    });

    useEffect(() => {
        setDoaDinheiro(prev => ({
            ...prev, doador: selectedDoador ? selectedDoador.id : ""
        }))
    }, [selectedDoador])
    // -----
    // Funções de manipulação de eventos
    const handleChangeData = (e) => {
        const value = e.target.value;
        setDoaDinheiro(prev => ({ ...prev, data: value }))
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

    const handleChangeValor = (e) => {
        const value = e.target.value.replace(/[a-zA-Z]/g, '');
        setDoaDinheiro(prev => ({ ...prev, valor: parseFloat(value) }))
        if (value && !isNaN(value) && parseFloat(value) >= 0) {
            setErrors((prev) => ({ ...prev, valor: null }));
        } else {
            if (value === "") {
                setErrors((prev) => ({ ...prev, valor: "O valor deve ser preenchido" }));
                setValidated(false);
            } else {
                setErrors((prev) => ({ ...prev, valor: "Valor inválido" }));
                setValidated(false);
            }
        }
    }

    const handleChangeDoador = (e) => {
        const value = e.target.value.replace(/[^\p{L}\s]/gu, '');
        setDoaDinheiro(prev => ({
            ...prev, doador: value
        }))
    }

    const handleChangeObservacoes = (e) => {
        const value = e.target.value;
        setDoaDinheiro(prev => ({
            ...prev, obs: value
        }))
        if (value === "") {
            setErrors((prev) => ({ ...prev, obs: null }));
        } else if (!isNaN(value)) {
            setErrors(prev => ({ ...prev, obs: "Texto inválido" }))
            setValidated(false);
        } else if (toString(value)) {
            setErrors((prev) => ({ ...prev, obs: null }));
        }
    }

    const handleChangeEvento = (e) => {
        const value = e.target.value;
        setDoaDinheiro(prev => ({
            ...prev, evento: value
        }))
    }

    const limpaForm = () => {
        setDoaDinheiro(prev => ({
            ...prev, data: "", valor: "",
            idoso: "", doador: "",evento: "", obs: ""
        }))
        setErrors({})
        setValidated(false)
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        let newErrors = {};

        if (!form.checkValidity()) {
            e.stopPropagation();
        }
        if (!doaDinheiro.data) {
            newErrors.data = "A data deve ser preenchida"
            setValidated(false);
        } else if (new Date(doaDinheiro.data) > new Date()) {
            newErrors.data = "A data não pode ser maior do que hoje";
            setValidated(false);
        }
        if (!doaDinheiro.valor) {
            newErrors.valor = "O valor deve ser preenchido";
            setValidated(false);
        } else if (parseFloat(doaDinheiro.valor) < 0) {
            newErrors.valor = "Valor inválido";
            setValidated(false);
        }
        if (!doaDinheiro.doador) {
            newErrors.doador = "Por favor, insira um doador válido";
            setValidated(false);
        }
        if (doaDinheiro.obs !== "" && !isNaN(doaDinheiro.obs)) {
            newErrors.obs = "Texto inválido";
            setValidated(false);
        }
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
        } else {
            setErrors([]);
            onSave(doaDinheiro);
            setValidated(true);
            setShowAlert(true);
            setTimeout(() => {
                setShowAlert(false);
            }, 3000);
        }
    }
    // -----
    return (
        // Formulário comum
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Alert variant="success" show={showAlert}> <b> <FaCheckCircle></FaCheckCircle> </b> Doação cadastrada com sucesso! </Alert>
            <Row>
                <Col md={6}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title className="mb-4"><h5>Informações da Doação</h5></Card.Title>
                            <Form.Group className="mb-3" controlId="data">
                                <Form.Label>Data da Doação</Form.Label>
                                <Form.Control type="date" name="data" onChange={handleChangeData}
                                    required
                                    value={doaDinheiro.data || ""}
                                    isInvalid={!!errors.data}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.data}
                                </Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="valor">
                                <Form.Label>Valor da Doação</Form.Label>
                                <Form.Control type="number" step={0.01} placeholder="R$ 0,00" name="valor" required
                                    onChange={handleChangeValor}
                                    value={doaDinheiro.valor || ""}
                                    isInvalid={!!errors.valor}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.valor}
                                </Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="doador">
                                <SelectDoador setDoador={setSelectedDoador} setErrors={setErrors} setValidated={setValidated} errors={errors}/>
                            </Form.Group>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title className="mb-4"><h5>Informações Adicionais (Opcional)</h5></Card.Title>
                            <Form.Group className="mb-3" controlId="doador">
                                <Form.Label>Destinatário</Form.Label>
                                <Form.Control
                                    name="idoso" type="text" />
                            </Form.Group>
                            <Form.Group className="mb-3"
                                controlId="evento">
                                <Form.Label>Evento</Form.Label>
                                <Form.Select onChange={handleChangeEvento}
                                    value={doaDinheiro.evento || ""} name="evento">
                                    <option value="">Nenhum evento relacionado</option>
                                    <option >Bazar Beneficente - Abril 2023</option>
                                    <option >Campanha do Agasalho 2023</option>
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="observacoes">
                                <Form.Label>Observações (Opcional)</Form.Label>
                                <Form.Control name="observacoes"
                                    onChange={handleChangeObservacoes}
                                    value={doaDinheiro.obs || ""}
                                    as="textarea" rows={3} isInvalid={!!errors.obs} />
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
                <Button variant="primary" type="submit">Registrar Doação</Button>
            </div>
        </Form>
    );
}

export default FormDinheiro;