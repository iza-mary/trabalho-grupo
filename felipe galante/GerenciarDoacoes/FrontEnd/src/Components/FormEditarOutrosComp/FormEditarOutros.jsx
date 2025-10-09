import { Button, Card, Col, Form, Row, Alert, Modal } from "react-bootstrap";
import { useEffect, useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import SelectDoador from './SelectDoador.jsx'
import './EditarOutros.css'

function FormEditarOutros({ show, onEdit, doacaoEdit }) {
    const [doaOutros, setDoaOutros] = useState({
        id: 0,
        data: "",
        tipo: "O",
        doador: {
            doadorId: 0,
            nome: "" || ""
        },
        evento: "" || "",
        obs: "" || "",
        doacao: {
            qntd: 0,
            item: "" || ""
        }
    })

    const [validated, setValidated] = useState(false);
    const [errors, setErrors] = useState({});
    const [showAlert, setShowAlert] = useState(false);
    const [showModal, setShowModal] = useState(true);

    useEffect(() => {
        setDoaOutros({
            id: parseInt(doacaoEdit.id),
            data: doacaoEdit.data.substring(0,10),
            tipo: doacaoEdit.tipo,
            doador: {
                doadorId: doacaoEdit.doador.doadorId || 0,
                nome: doacaoEdit.doador.nome || ""
            },
            evento: doacaoEdit.evento || "",
            obs: doacaoEdit.obs || "",
            doacao: doacaoEdit.tipo.toUpperCase() === "D" ? {
                valor: parseFloat(doacaoEdit.doacao.valor) || 0,
            } : {
                qntd: parseInt(doacaoEdit.doacao.qntd) || 0,
                item: doacaoEdit.doacao.item || "-",
            }
        })
    }, [doacaoEdit]);

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
        setDoaOutros(prev => ({ ...prev, doacao: {
            ...prev.doacao,
            item: value
        } }))
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
        setDoaOutros(prev => ({ ...prev, doacao: {
            ...prev.doacao,
            qntd: parseInt(value)
        } }))
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

        setDoaOutros(prev => ({
            ...prev,
            telefone: formatado
        })); // Atualiza o estado com o valor formatado
    }

    const handleChangeEvento = (e) => {
        const value = e.target.value;
        setDoaOutros(prev => ({ ...prev, evento: value }));
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
        } else if (!isNaN(doaOutros.doacao.item)) {
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

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
        } else {
            setErrors({});
            onEdit(doaOutros);
            setValidated(true);
            setShowAlert(true);
            setTimeout(() => {
                setShowAlert(false)
            }, 3000)
        }
    }

    return (
        <Modal
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
                                        <SelectDoador setDoador={setDoaOutros} setErrors={setErrors} setValidated={setValidated} errors={errors} selectedDoadorEdit={doaOutros.doador}/>
                                    </Form.Group>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card className="mb-4">
                                <Card.Body>
                                    <Card.Title className="mb-4"><h5>Informações Adicionais (Opcional)</h5></Card.Title>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Destinatário</Form.Label>
                                        <Form.Control
                                            name="destinatario" type="text" />
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
                        <Button variant="secondary" onClick={() => { setShowModal(false), show(true) }} type="button">Cancelar</Button>
                        <Button variant="warning" type="submit" style={{ color: "white" }}>Atualizar Doação</Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
}

export default FormEditarOutros