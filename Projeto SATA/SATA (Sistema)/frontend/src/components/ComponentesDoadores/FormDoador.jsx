import React, { useState, useRef } from 'react';
import { Button, Card, Form, Row, Col, Alert } from 'react-bootstrap';
import { formatarRG, normalizarRG, validarRG, formatarCNPJ, validarCNPJ, normalizarCNPJ, normalizarCPF, validarCPF, formatarCPF } from '../../pages/validacoes';
import { PlusCircle } from 'react-bootstrap-icons';
import './SataDoadores.css';

function FormDoador({ onSubmit, doadores }) {
  const [validated, setValidated] = useState(false);
  const [doador, setDoador] = useState({
    tipo: 'PF',
    nome: "",
    cpf: "",
    cnpj: "",
    dataNascimento: "",
    representante: "",
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

  const limpaForm = () => {
    setDoador({
      tipo: 'PF',
      nome: "",
      cpf: "",
      cnpj: "",
      dataNascimento: "",
      representante: "",
      telefone: "",
      rg: "",
      email: "",
      cidade: "",
      rua: "",
      numero: "",
      cep: "",
      complemento: ""
    });
    setValidated(false);
    setErrors({});
  };

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

  const handleChangeTipo = (e) => {
    const tipo = e.target.value;
    setDoador(prev => ({ ...prev, tipo }));
    // Limpa documentos do outro tipo para evitar validação/duplicidade indevida
    if (tipo === 'PF') {
      setDoador(prev => ({ ...prev, cnpj: "", representante: "" }));
    } else {
      setDoador(prev => ({ ...prev, cpf: "", dataNascimento: "" }));
    }
  };

  const handleChangeCpf = (e) => {
    let value = formatarCPF(e.target.value);
    setDoador(prev => ({ ...prev, cpf: value }));
    const raw = normalizarCPF(value);
    if (raw && validarCPF(value)) {
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
      const cpfExistente = doadores.find(doadr => doadr.cpf === value);
      if (cpfExistente) {
        setErrors(prev => ({...prev, cpf: "Este CPF já existe"}));
        setValidated(false);
      }
    }, 3000);
  };

  const handleChangeCnpj = (e) => {
    const masked = formatarCNPJ(e.target.value);
    const raw = normalizarCNPJ(masked);
    setDoador(prev => ({ ...prev, cnpj: masked }));
    if (!masked) {
      setErrors(prev => ({ ...prev, cnpj: "CNPJ é obrigatório" }));
      setValidated(false);
    } else if (!validarCNPJ(raw)) {
      setErrors(prev => ({ ...prev, cnpj: "CNPJ inválido" }));
      setValidated(false);
    } else {
      setErrors(prev => ({ ...prev, cnpj: null }));
    }

    clearTimeout(timeOutId.current);
    timeOutId.current = setTimeout(() => {
      const cnpjExistente = doadores.find(d => d.cnpj === masked);
      if (cnpjExistente) {
        setErrors(prev => ({ ...prev, cnpj: "Este CNPJ já existe" }));
        setValidated(false);
      }
    }, 3000);
  };

  const handleChangeDataNascimento = (e) => {
    const value = e.target.value;
    setDoador(prev => ({ ...prev, dataNascimento: value }));
    if (!value) {
      setErrors(prev => ({ ...prev, dataNascimento: "Data de nascimento é obrigatória" }));
      setValidated(false);
    } else {
      const dt = new Date(value);
      const hoje = new Date(); hoje.setHours(0,0,0,0);
      if (isNaN(dt.getTime()) || dt > hoje) {
        setErrors(prev => ({ ...prev, dataNascimento: "Data de nascimento inválida" }));
        setValidated(false);
      } else {
        setErrors(prev => ({ ...prev, dataNascimento: null }));
      }
    }
  };

  const handleChangeRepresentante = (e) => {
    const value = e.target.value;
    setDoador(prev => ({ ...prev, representante: value }));
    if (!value || !value.trim()) {
      setErrors(prev => ({ ...prev, representante: "Representante legal é obrigatório" }));
      setValidated(false);
    } else {
      setErrors(prev => ({ ...prev, representante: null }));
    }
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
    const masked = formatarRG(e.target.value);
    const raw = normalizarRG(masked);
    setDoador(prev => ({ ...prev, rg: masked }));
    if (raw && !validarRG(raw)) {
      setErrors(prev => ({ ...prev, rg: 'RG inválido' }));
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
    setDoador(prev => ({ ...prev, cidade: value }));
  };

  const handleChangeRua = (e) => {
    const value = e.target.value;
    setDoador(prev => ({ ...prev, rua: value }));
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
    setDoador(prev => ({ ...prev, numero: value }));
  };

  const handleChangeCep = (e) => {
    let value = e.target.value;
    value = value.replace(/\D/g, "");
    if (value.length > 5) {
      value = value.replace(/^(\d{5})(\d{1,3})$/, "$1-$2");
    }
    setDoador(prev => ({ ...prev, cep: value }));

    if (value && value.length !== 9) {
      setErrors(prev => ({ ...prev, cep: "CEP inválido" }));
      setValidated(false);
    } else {
      setErrors(prev => ({ ...prev, cep: null }));
    }
  };

  const handleChangeComp = (e) => {
    const value = e.target.value;
    setDoador(prev => ({ ...prev, complemento: value }));
    if (value && !isNaN(value)) {
      setErrors(prev => ({ ...prev, complemento: "Texto inválido" }));
      setValidated(false);
    } else {
      setErrors(prev => ({ ...prev, complemento: null }));
    }
  };

  function handleSubmit(e) {
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

    if (doador.tipo === 'PF') {
      if (!doador.cpf) {
        newErrors.cpf = "CPF é obrigatório";
        setValidated(false);
      } else if (!validarCPF(doador.cpf)) {
        newErrors.cpf = "CPF inválido";
        setValidated(false);
      }
      if (!doador.dataNascimento) {
        newErrors.dataNascimento = "Data de nascimento é obrigatória";
        setValidated(false);
      }
    } else {
      if (!doador.cnpj) {
        newErrors.cnpj = "CNPJ é obrigatório";
        setValidated(false);
      } else if (!validarCNPJ(doador.cnpj)) {
        newErrors.cnpj = "CNPJ inválido";
        setValidated(false);
      }
      if (!doador.representante || !doador.representante.trim()) {
        newErrors.representante = "Representante legal é obrigatório";
        setValidated(false);
      }
    }

    if (!doador.telefone) {
      newErrors.telefone = "Telefone é obrigatório";
      setValidated(false);
    } else if (doador.telefone.length !== 14 && doador.telefone.length !== 15) {
      newErrors.telefone = "Telefone inválido";
      setValidated(false);
    }

    if (doador.rg) {
      const rawRG = normalizarRG(doador.rg);
      if (!validarRG(rawRG)) {
        newErrors.rg = "RG inválido";
        setValidated(false);
      }
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

    if (doador.tipo === 'PF') {
      const cpfExistente = doadores.find(d => d.cpf === doador.cpf);
      if (cpfExistente) {
        newErrors.cpf = "Este CPF já existe";
        setValidated(false);
      }
    } else {
      const cnpjExistente = doadores.find(d => d.cnpj === doador.cnpj);
      if (cnpjExistente) {
        newErrors.cnpj = "Este CNPJ já existe";
        setValidated(false);
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      const payload = {
        ...doador,
        nome: doador.nome?.trim(),
        cpf: doador.tipo === 'PF' ? normalizarCPF(doador.cpf) : null,
        cnpj: doador.tipo === 'PJ' ? normalizarCNPJ(doador.cnpj) : null,
        rg: normalizarRG(doador.rg)
      };
      // Campos extras (dataNascimento/representante) não são persistidos no schema atual
      onSubmit(payload);
      setValidated(true);
    }
  }

   return (
    <div className="content">
      <Card>
        <Card.Header>
          <h4 className="mb-0">Cadastro de Doador</h4>
        </Card.Header>
        <Card.Body>
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <h5 className="mb-3">Dados do Doador</h5>
                <Form.Group className="mb-3" controlId="tipo">
                  <Form.Label>Tipo de Doador</Form.Label>
                  <Form.Select value={doador.tipo} onChange={handleChangeTipo}>
                    <option value="PF">Pessoa Física</option>
                    <option value="PJ">Pessoa Jurídica</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3" controlId="nome">
                  <Form.Label>{doador.tipo === 'PF' ? 'Nome Completo' : 'Razão Social'}</Form.Label>
                  <Form.Control
                    isInvalid={!!errors.nome}
                    required
                    value={doador.nome}
                    onChange={handleChangeNome}
                    placeholder={doador.tipo === 'PF' ? 'Nome Sobrenome' : 'Empresa Ltda'}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.nome}
                  </Form.Control.Feedback>
                </Form.Group>
                {doador.tipo === 'PF' ? (
                  <>
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
                    <Form.Group className="mb-3" controlId="dataNascimento">
                      <Form.Label>Data de Nascimento</Form.Label>
                      <Form.Control 
                        type="date"
                        value={doador.dataNascimento}
                        onChange={handleChangeDataNascimento}
                        isInvalid={!!errors.dataNascimento}
                        required
                      />
                      <Form.Control.Feedback type="invalid">{errors.dataNascimento}</Form.Control.Feedback>
                    </Form.Group>
                  </>
                ) : (
                  <>
                    <Form.Group className="mb-3" controlId="cnpj">
                      <Form.Label>CNPJ</Form.Label>
                      <Form.Control 
                        maxLength={18} 
                        onChange={handleChangeCnpj} 
                        value={doador.cnpj} 
                        isInvalid={!!errors.cnpj} 
                        type="text" 
                        placeholder="12.345.678/0001-90" 
                      />
                      <Form.Control.Feedback type="invalid">{errors.cnpj}</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="representante">
                      <Form.Label>Representante Legal</Form.Label>
                      <Form.Control 
                        value={doador.representante}
                        onChange={handleChangeRepresentante}
                        isInvalid={!!errors.representante}
                        required
                        placeholder="Nome do representante"
                      />
                      <Form.Control.Feedback type="invalid">{errors.representante}</Form.Control.Feedback>
                    </Form.Group>
                  </>
                )}

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
                    maxLength={14} 
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
              <Button 
                variant="outline-secondary" 
                onClick={limpaForm}
                className="me-2"
              >
                Limpar
              </Button>
              <Button variant="primary" type="submit">
                Cadastrar Doador
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}

export default FormDoador;