import React, { useEffect, useState, useRef } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { Pencil } from 'react-bootstrap-icons';
import './SataDoadores.css';

function FormEditDoador({ doadores, show, ocultaModal, doador: doadorToEdit, onEdit }) {
  const [validated, setValidated] = useState(false);
  const [doador, setDoador] = useState({
    id: 0,
    nome: "",
    cpf: "",
    telefone: "",
    rg: "",
    email: "",
    cidade: "",
    rua: "",
    numero: "",
    cep: "",
    complemento: ""
  });
  const [errors, setErrors] = useState({});
  const timeOutId = useRef(null);

  useEffect(() => {
    if (doadorToEdit) {
      setDoador({
        id: doadorToEdit.id,
        nome: doadorToEdit.nome,
        cpf: doadorToEdit.cpf,
        telefone: doadorToEdit.telefone,
        rg: doadorToEdit.rg || "",
        email: doadorToEdit.email || "",
        cidade: doadorToEdit.cidade || "",
        rua: doadorToEdit.rua || "",
        numero: doadorToEdit.numero || "",
        cep: doadorToEdit.cep || "",
        complemento: doadorToEdit.complemento || ""
      });
    }
  }, [doadorToEdit]);

  const handleChangeNome = (e) => {
    let value = e.target.value;
    value = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");
    setDoador(prev => ({ ...prev, nome: value }));
    if (value) {
      setErrors(prev => ({ ...prev, nome: null }));
    } else {
      setErrors(prev => ({ ...prev, nome: "Nome é obrigatório" }));
      setValidated(false);
    }
  };

  const handleChangeCpf = (e) => {
    let value = e.target.value;
    value = value.replace(/\D/g, "");
    if (value.length > 3) value = value.replace(/^(\d{3})(\d)/, "$1.$2");
    if (value.length > 6) value = value.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
    if (value.length > 9) value = value.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
    setDoador(prev => ({ ...prev, cpf: value }));
    
    if (value && value.length === 14) {
      setErrors(prev => ({ ...prev, cpf: null }));
    } else if (!value) {
      setErrors(prev => ({ ...prev, cpf: "CPF é obrigatório" }));
      setValidated(false);
    } else {
      setErrors(prev => ({ ...prev, cpf: "CPF inválido" }));
      setValidated(false);
    }

    clearTimeout(timeOutId.current);

    timeOutId.current = setTimeout(() => {
      const cpfExistente = doadores.find(doadr => doadr.cpf === value && doadr.id !== doador.id);
      if (cpfExistente) {
        setErrors(prev => ({...prev, cpf: "Este CPF já existe"}));
        setValidated(false);
      }
    }, 3000);
  };

  const handleChangeTelefone = (e) => {
    let value = e.target.value;
    value = value.replace(/\D/g, "");
    if (value.length > 10) {
      value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    } else if (value.length > 6) {
      value = value.replace(/^(\d{2})(\d{4})(\d{0,4})$/, "($1) $2-$3");
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,5})$/, "($1) $2");
    } else if (value.length > 0) {
      value = value.replace(/^(\d{0,2})$/, "($1");
    }

    setDoador(prev => ({ ...prev, telefone: value }));
    if (!value) {
      setErrors(prev => ({ ...prev, telefone: "Telefone é obrigatório" }));
      setValidated(false);
    } else if (value.length !== 14 && value.length !== 15) {
      setErrors(prev => ({ ...prev, telefone: "Telefone inválido" }));
      setValidated(false);
    } else {
      setErrors(prev => ({ ...prev, telefone: null }));
    }
  };

  const handleChangeRg = (e) => {
    let value = e.target.value;
    value = value.replace(/\D/g, "");
    if (value.length > 2) value = value.replace(/^(\d{2})(\d)/, "$1.$2");
    if (value.length > 5) value = value.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    if (value.length > 8) value = value.replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");

    setDoador(prev => ({ ...prev, rg: value }));
    if (value && value.length !== 12) {
      setErrors(prev => ({ ...prev, rg: "RG inválido" }));
      setValidated(false);
    } else {
      setErrors(prev => ({ ...prev, rg: null }));
    }
  };

  const handleChangeEmail = (e) => {
    const value = e.target.value;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setDoador(prev => ({ ...prev, email: value }));
    if (!value) {
      setErrors(prev => ({ ...prev, email: null }));
      setValidated(true);
    } else if (!regex.test(value)) {
      setErrors(prev => ({ ...prev, email: "E-mail inválido" }));
      setValidated(false);
    } else {
      setErrors(prev => ({ ...prev, email: null }));
    }
  };

  const handleChangeCidade = (e) => {
    let value = e.target.value;
    value = value.replace(/[0-9]/g, "");
    setDoador(prev => ({...prev, cidade: value}));
  };

  const handleChangeRua = (e) => {
    const value = e.target.value;
    setDoador(prev => ({...prev, rua: value}));
    if (value && !isNaN(value)) {
      setErrors(prev => ({ ...prev, rua: "Texto inválido" }));
      setValidated(false);
    } else {
      setErrors(prev => ({ ...prev, rua: null }));
    }
  };

  const handleChangeNumero = (e) => {
    let value = e.target.value;
    value = value.replace(/[^0-9]/g, "");
    setDoador(prev => ({...prev, numero: value}));
  };

  const handleChangeCep = (e) => {
    let value = e.target.value;
    value = value.replace(/\D/g, "");
    if (value.length > 5) {
      value = value.replace(/^(\d{5})(\d{1,3})$/, "$1-$2");
    }
    setDoador(prev => ({...prev, cep: value}));

    if(value && value.length !== 9) {
      setErrors(prev => ({...prev, cep: "CEP inválido"}));
      setValidated(false);
    } else {
      setErrors(prev => ({...prev, cep: null}));
    }
  };

  const handleChangeComp = (e) => {
    const value = e.target.value;
    setDoador(prev => ({...prev, complemento: value}));
    if (value && !isNaN(value)) {
      setErrors(prev => ({...prev, complemento: "Texto inválido"}));
      setValidated(false);
    } else {
      setErrors(prev => ({...prev, complemento: null}));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    let newErrors = {};
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
    }
    
    if (!doador.nome) {
      newErrors.nome = "Nome é obrigatório";
      setValidated(false);
    }

    if (!doador.cpf) {
      newErrors.cpf = "CPF é obrigatório";
      setValidated(false);
    } else if (doador.cpf.length !== 14) {
      newErrors.cpf = "CPF inválido";
      setValidated(false);
    }

    if (!doador.telefone) {
      newErrors.telefone = "Telefone é obrigatório";
      setValidated(false);
    } else if (doador.telefone.length !== 14 && doador.telefone.length !== 15) {
      newErrors.telefone = "Telefone inválido";
      setValidated(false);
    }

    if (doador.rg && doador.rg.length !== 12) {
      newErrors.rg = "RG inválido";
      setValidated(false);
    }

    if (doador.email) {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!regex.test(doador.email)) {
        newErrors.email = "E-mail inválido";
        setValidated(false);
      }
    }

    if (doador.rua && !isNaN(doador.rua)) {
      newErrors.rua = "Texto inválido";
      setValidated(false);
    }

    if (doador.cep && doador.cep.length !== 9) {
      newErrors.cep = "CEP inválido";
      setValidated(false);
    }

    if (doador.complemento && !isNaN(doador.complemento)) {
      newErrors.complemento = "Texto inválido";
      setValidated(false);
    }

    const cpfExistente = doadores.find(doadr => doadr.cpf === doador.cpf && doadr.id !== doador.id);
    if (cpfExistente) {
      newErrors.cpf = "Este CPF já existe";
      setValidated(false);
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      onEdit(doador);
      setValidated(true);
    }
  };

  return (
    <Modal show={show} onHide={() => ocultaModal(false)} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Editar Doador</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <h5 className="mb-3">Dados Pessoais</h5>
              <Form.Group className="mb-3" controlId="nome">
                <Form.Label>Nome Completo</Form.Label>
                <Form.Control
                  isInvalid={!!errors.nome}
                  required
                  value={doador.nome}
                  onChange={handleChangeNome}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.nome}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="cpf">
                <Form.Label>CPF</Form.Label>
                <Form.Control 
                  maxLength={14} 
                  onChange={handleChangeCpf} 
                  value={doador.cpf} 
                  isInvalid={!!errors.cpf} 
                  type="text" 
                  placeholder="123.456.789-01" 
                />
                <Form.Control.Feedback type="invalid">{errors.cpf}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="telefone">
                <Form.Label>Telefone</Form.Label>
                <Form.Control 
                  maxLength={15} 
                  onChange={handleChangeTelefone} 
                  value={doador.telefone} 
                  isInvalid={!!errors.telefone} 
                  type="tel" 
                  placeholder="(12) 34567-8901" 
                />
                <Form.Control.Feedback type="invalid">{errors.telefone}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="rg">
                <Form.Label>RG (Opcional)</Form.Label>
                <Form.Control 
                  onChange={handleChangeRg} 
                  isInvalid={!!errors.rg} 
                  value={doador.rg} 
                  maxLength={12} 
                  type="text" 
                  placeholder="12.345.678-9" 
                />
                <Form.Control.Feedback type="invalid">{errors.rg}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="email">
                <Form.Label>E-mail (Opcional)</Form.Label>
                <Form.Control 
                  onChange={handleChangeEmail} 
                  isInvalid={!!errors.email} 
                  value={doador.email} 
                  type="email" 
                  placeholder="exemplo@exemplo.com" 
                />
                <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <h5 className="mb-3">Endereço (Opcional)</h5>
              <Form.Group className="mb-3" controlId="cidade">
                <Form.Label>Cidade</Form.Label>
                <Form.Control 
                  onChange={handleChangeCidade} 
                  value={doador.cidade} 
                  placeholder="Cidade (Estado)" 
                  type="text" 
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="rua">
                <Form.Label>Rua</Form.Label>
                <Form.Control 
                  onChange={handleChangeRua} 
                  isInvalid={!!errors.rua} 
                  value={doador.rua} 
                  placeholder="Rua, Bairro" 
                  type="text" 
                />
                <Form.Control.Feedback type="invalid">{errors.rua}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="numero">
                <Form.Label>Número</Form.Label>
                <Form.Control 
                  onChange={handleChangeNumero} 
                  value={doador.numero} 
                  type="text" 
                  placeholder="99" 
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="cep">
                <Form.Label>CEP</Form.Label>
                <Form.Control 
                  isInvalid={!!errors.cep} 
                  maxLength={9} 
                  onChange={handleChangeCep} 
                  value={doador.cep} 
                  type="text" 
                  placeholder="12345-000" 
                />
                <Form.Control.Feedback type="invalid">{errors.cep}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="complemento">
                <Form.Label>Complemento</Form.Label>
                <Form.Control 
                  onChange={handleChangeComp} 
                  isInvalid={!!errors.complemento} 
                  value={doador.complemento} 
                  as="textarea" 
                  rows={3}
                  placeholder="Andar 5, Ap 21, Bloco 3" 
                />
                <Form.Control.Feedback type="invalid">{errors.complemento}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          <div className="d-flex justify-content-end mt-4">
            <Button variant="primary" type="submit">
              <Pencil className="me-1" /> Salvar Alterações
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default FormEditDoador;