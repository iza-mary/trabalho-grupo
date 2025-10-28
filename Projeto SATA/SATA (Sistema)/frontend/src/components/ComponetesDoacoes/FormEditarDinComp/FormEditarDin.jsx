import { Button, Card, Col, Form, Row, Alert, Modal } from "react-bootstrap";
import { useEffect, useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import SelectDoador from "./SelectDoador.jsx";
import SelectIdoso from "../Shared/SelectIdoso";
import SelectEvento from "../Shared/SelectEvento";
import "./EditarDin.css"

function FormEditarDin({ show, doacaoEdit, onEdit }) {
    // Estados
    const [doaDinheiro, setDoaDinheiro] = useState({
        id: 0,
        data: "",
        tipo: "D",
        doador: {
            doadorId: 0,
            nome: ""
        },
        idoso: "",
        evento: "",
        eventoId: null,
        obs: "",
        doacao: {
            qntd: 0,
            item: "-",
            valor: 0
        }
    });

    const [validated, setValidated] = useState(false);
    const [errors, setErrors] = useState({});
    const [showAlert, setShowAlert] = useState(false);
    const [showModal, setShowModal] = useState(true);
    // -----

    useEffect(() => {
        setDoaDinheiro({
            id: parseInt(doacaoEdit?.id),
            data: (doacaoEdit?.data || "").substring(0,10),
            tipo: doacaoEdit?.tipo,
            doador: {
                doadorId: doacaoEdit?.doador?.doadorId ?? doacaoEdit?.doador?.id ?? 0,
                nome: doacaoEdit?.doador?.nome ?? ""
            },
            idoso: doacaoEdit?.idoso || "",
            evento: doacaoEdit?.evento || "",
            eventoId: doacaoEdit?.eventoId ?? null,
            obs: doacaoEdit?.obs || "",
            doacao: (doacaoEdit?.tipo || "").toUpperCase() === "D" ? {
                valor: parseFloat(doacaoEdit?.doacao?.valor) || 0,
            } : {
                qntd: parseInt(doacaoEdit?.doacao?.qntd) || 0,
                item: doacaoEdit?.doacao?.item || "-",
            }
        })
    }, [doacaoEdit]);

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
            } else if (new Date(value) > new Date()) {
                setErrors((prev) => ({ ...prev, data: "A data não pode ser maior do que hoje" }))
                setValidated(false);
            }
        }
    }

    const handleChangeValor = (e) => {
        const value = e.target.value.replace(/[a-zA-Z]/g, '');
        setDoaDinheiro(prev => ({ ...prev, doacao: { valor: parseFloat(value) } }))
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

    const handleChangeObservacoes = (e) => {
        const value = e.target.value;
        setDoaDinheiro(prev => ({
            ...prev, obs: value
        }))
        if (value === "") {
            setErrors((prev) => ({ ...prev, obs: null }));
        } else if (!isNaN(value)) {
            setErrors(prev => ({ ...prev, obs: "Texto inválido" }))
        } else if (toString(value)) {
            setErrors((prev) => ({ ...prev, obs: null }));
        }
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
        if (!doaDinheiro.doacao.valor && doaDinheiro.doacao.valor !== 0) {
            newErrors.valor = "O valor deve ser preenchido";
            setValidated(false);
        } else if (parseFloat(doaDinheiro.doacao.valor) < 0) {
            newErrors.valor = "Valor inválido";
            setValidated(false);
        }
        // Doador obrigatório: exigir um doador selecionado com id válido
        const did = Number(doaDinheiro?.doador?.doadorId);
        if (!did || did <= 0) {
            newErrors.doador = "Doador é obrigatório";
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
            onEdit(doaDinheiro)
            setValidated(true);
            setShowAlert(true);
            setTimeout(() => {
                setShowAlert(false);
            }, 3000);
        }
    }


    return (

        <Modal
            id="modal"
            show={showModal}
            onHide={() => { setShowModal(false), show(true) }}
            dialogClassName="modal-90w"
            aria-labelledby="example-custom-modal-styling-title"
        >
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
                                    <Form.Group className="mb-3" controlId="data">
                                        <Form.Label>Data da Doação (Obrigatório)</Form.Label>
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
                                        <Form.Label>Valor da Doação (Obrigatório)</Form.Label>
                                        <Form.Control type="number" step={0.01} placeholder="R$ 0,00" name="valor" required
                                            onChange={handleChangeValor}
                                            value={doaDinheiro.doacao.valor || ""}
                                            isInvalid={!!errors.valor}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.valor}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                    <Form.Group className="mb-3" controlId="destinatario">
                                        <SelectDoador setDoador={setDoaDinheiro} setErrors={setErrors} setValidated={setValidated} errors={errors} selectedDoadorEdit={doaDinheiro.doador} />
                                        <Form.Control.Feedback type="invalid">
                                            Por favor, selecione um doador.
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card className="mb-4">
                                <Card.Body>
                                    <Card.Title className="mb-4"><h5>Informações Adicionais (Opcional)</h5></Card.Title>
                                    <Form.Group className="mb-3" controlId="idoso">
                                        <SelectIdoso
                                          setIdoso={(idosoSel) => setDoaDinheiro(prev => ({ ...prev, idoso: idosoSel }))}
                                          setErrors={setErrors}
                                          setValidated={setValidated}
                                          errors={errors}
                                          errorKey="idoso"
                                          selectedIdosoEdit={
                                            (doaDinheiro?.idoso && typeof doaDinheiro.idoso === 'object' && doaDinheiro.idoso.nome)
                                              ? doaDinheiro.idoso
                                              : (doaDinheiro?.idoso
                                                  ? { id: 0, nome: doaDinheiro.idoso }
                                                  : null)
                                          }
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3" controlId="evento">
                                        <SelectEvento
                                          setEvento={(eventoTitulo) => setDoaDinheiro(prev => ({ ...prev, evento: eventoTitulo }))}
                                          setEventoId={(id) => setDoaDinheiro(prev => ({ ...prev, eventoId: id }))}
                                          setErrors={setErrors}
                                          setValidated={setValidated}
                                          errors={errors}
                                          selectedEventoEdit={doaDinheiro.evento}
                                        />
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
                        <Button variant="secondary" type="button" onClick={() => { setShowModal(false), show(true) }}>Cancelar</Button>
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

export default FormEditarDin