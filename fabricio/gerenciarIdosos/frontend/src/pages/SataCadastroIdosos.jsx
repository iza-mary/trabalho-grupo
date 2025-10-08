import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Form, 
  Button, 
  Breadcrumb, 
  Card,
  Alert,
  Spinner,
  Modal
} from 'react-bootstrap';
import { 
  PersonFill, 
  HouseFill,
  Hospital,
  FileEarmarkText
} from 'react-bootstrap-icons';
import { useParams, useNavigate } from 'react-router-dom';
import './SataCadastroIdosos.css';
import {
  validarFormulario,
  validarFormularioInternacao,
  formatarTelefone,
  formatarCPF,
  formatarCEP
} from './validacoes';
import idosoService from '../services/idosoService';
import internacaoService from '../services/internacaoService';
import Lateral from '../components/Lateral';

const estadosBrasileiros = [
  'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará',
  'Distrito Federal', 'Espírito Santo', 'Goiás', 'Maranhão',
  'Mato Grosso', 'Mato Grosso do Sul', 'Minas Gerais', 'Pará',
  'Paraíba', 'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro',
  'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia', 'Roraima',
  'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
];

const SataCadastroIdosos = () => {
  const { id, acao } = useParams();
  const navigate = useNavigate();
  const estaEditando = !!id;
  const editandoInternacao = acao === 'internacao';
  
  const [formData, setFormData] = useState({
    nome: '',
    dataNascimento: '',
    genero: '',
    rg: '',
    cpf: '',
    cartaoSus: '',
    telefone: '',
    rua: '',
    numero: '',
    complemento: '',
    cidade: '',
    estado: 'São Paulo',
    cep: '',
    dataEntrada: '',
    quarto: '',
    cama: '',
    observacoes: '',
    status: 'nao_internado'
  });
  
  const [erros, setErros] = useState({});
  const [errosInternacao, setErrosInternacao] = useState({});
  const [submetido, setSubmetido] = useState(false);
  const [submetidoInternacao, setSubmetidoInternacao] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mostrarModalConfirmacao, setMostrarModalConfirmacao] = useState(false);
  const [quartosDisponiveis, setQuartosDisponiveis] = useState([]);
  const [camasDisponiveis, setCamasDisponiveis] = useState([]);

  useEffect(() => {
    if (estaEditando) {
      const carregarIdoso = async () => {
        setCarregando(true);
        try {
          const idosoParaEditar = await idosoService.getById(id);
          if (idosoParaEditar) {
            setFormData({
              ...idosoParaEditar,
              dataNascimento: idosoParaEditar.dataNascimento?.split('T')[0] || '',
              dataEntrada: idosoParaEditar.dataEntrada?.split('T')[0] || '',
              rua: idosoParaEditar.rua || '',
              numero: idosoParaEditar.numero || '',
              complemento: idosoParaEditar.complemento || '',
              cidade: idosoParaEditar.cidade || '',
              cep: idosoParaEditar.cep || '',
              estado: idosoParaEditar.estado || 'São Paulo'
            });
          }
        } catch (error) {
          console.error('Erro ao carregar idoso:', error);
          alert('Erro ao carregar dados do idoso');
        } finally {
          setCarregando(false);
        }
      };
      carregarIdoso();
    }
  }, [estaEditando, id]);

  // Carregar quartos disponíveis quando estiver editando internação
  useEffect(() => {
    const carregarQuartos = async () => {
      try {
        const quartos = await internacaoService.buscarQuartosDisponiveis();
        setQuartosDisponiveis(quartos);
      } catch (error) {
        console.error('Erro ao carregar quartos disponíveis:', error);
        setQuartosDisponiveis([]);
      }
    };
    if (editandoInternacao) {
      carregarQuartos();
    }
  }, [editandoInternacao]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let valorFormatado = value;
    if (name === 'cpf') {
      valorFormatado = formatarCPF(value);
    } else if (name === 'telefone') {
      valorFormatado = formatarTelefone(value);
    } else if (name === 'cep') {
      valorFormatado = formatarCEP(value);
    }
    
    setFormData({
      ...formData,
      [name]: valorFormatado
    });
  };

  const carregarCamasPorQuarto = async (quartoId) => {
    try {
      if (!quartoId) {
        setCamasDisponiveis([]);
        return;
      }
      const camas = await internacaoService.buscarCamasDisponiveis(quartoId);
      setCamasDisponiveis(camas);
    } catch (error) {
      console.error('Erro ao carregar camas disponíveis:', error);
      setCamasDisponiveis([]);
    }
  };

  const handleChangeInternacao = async (e) => {
    const { name, value } = e.target;
    if (name === 'quarto') {
      setFormData(prev => ({ ...prev, quarto: value, cama: '' }));
      await carregarCamasPorQuarto(value);
    } else if (name === 'cama') {
      setFormData(prev => ({ ...prev, cama: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const salvarDadosBasicos = async () => {
    setSubmetido(true);
    const errosValidacao = validarFormulario(formData);
    setErros(errosValidacao);
    
    if (Object.keys(errosValidacao).length === 0) {
      setMostrarModalConfirmacao(true);
    }
  };

  const confirmarEdicao = async () => {
    setSalvando(true);
    try {
      if (estaEditando) {
        await idosoService.update(id, formData);
        alert('Cadastro atualizado com sucesso!');
      } else {
        await idosoService.add(formData);
        alert('Cadastro criado com sucesso!');
      }
      navigate('/');
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert(`Erro: ${error.message}`);
    } finally {
      setSalvando(false);
      setMostrarModalConfirmacao(false);
    }
  };

  const salvarInternacao = async () => {
    setSubmetidoInternacao(true);
    const errosValidacao = validarFormularioInternacao(formData);
    setErrosInternacao(errosValidacao);
    
    if (Object.keys(errosValidacao).length === 0) {
      setSalvando(true);
      try {
        await idosoService.update(id, {
          ...formData,
          status: 'internado'
        });
        alert('Dados de internação atualizados com sucesso!');
        navigate('/');
      } catch (error) {
        console.error('Erro ao salvar internação:', error);
        alert('Erro ao salvar os dados de internação. Por favor, tente novamente.');
      } finally {
        setSalvando(false);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editandoInternacao) {
      salvarInternacao();
    } else {
      salvarDadosBasicos();
    }
  };

  if (carregando) {
    return (
      <Lateral>
        <Container fluid className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <Spinner animation="border" variant="primary" />
        </Container>
      </Lateral>
    );
  }

  return (
    <Lateral>
      <div className="content-area">
        <Container fluid className="container-principal">
          <Row className="mb-4 linha-cabecalho">
            <Col>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="mb-0 d-flex align-items-center">
                    {!editandoInternacao && !estaEditando && (
                      <FileEarmarkText className="me-2" />
                    )}
                    {editandoInternacao ? 'Editar Internação' : 
                     estaEditando ? 'Editar Idoso' : 'Cadastro de Idoso'}
                  </h2>
                </div>
                <div>
                  <Button 
                    variant="secondary"
                    onClick={() => navigate('/idosos')}
                    className="d-flex align-items-center"
                    title="Ir para lista de idosos"
                  >
                    Lista de Idosos
                  </Button>
                </div>
              </div>
            </Col>
          </Row>

          {submetido && Object.keys(erros).length > 0 && (
            <Alert variant="danger" className="mb-4">
              Por favor, corrija os erros no formulário antes de enviar.
            </Alert>
          )}

          {submetidoInternacao && Object.keys(errosInternacao).length > 0 && (
            <Alert variant="danger" className="mb-4">
              Por favor, corrija os erros no formulário de internação antes de enviar.
            </Alert>
          )}

          <Form onSubmit={handleSubmit} noValidate>
            {!editandoInternacao && (
              <>
                <Card className="mb-4 secao-formulario">
                  <Card.Header>
                    <PersonFill className="me-2" /> Dados Pessoais
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Label>Nome Completo</Form.Label>
                        <Form.Control
                          type="text"
                          name="nome"
                          value={formData.nome}
                          onChange={handleChange}
                          isInvalid={!!erros.nome}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          {erros.nome}
                        </Form.Control.Feedback>
                      </Col>
                      <Col md={3} className="mb-3">
                        <Form.Label>Data de Nascimento</Form.Label>
                        <Form.Control
                          type="date"
                          name="dataNascimento"
                          value={formData.dataNascimento}
                          onChange={handleChange}
                          isInvalid={!!erros.dataNascimento}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          {erros.dataNascimento}
                        </Form.Control.Feedback>
                      </Col>
                      <Col md={3} className="mb-3">
                        <Form.Label>Gênero</Form.Label>
                        <Form.Select
                          name="genero"
                          value={formData.genero}
                          onChange={handleChange}
                          isInvalid={!!erros.genero}
                          required
                        >
                          <option value="">Selecione</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Feminino">Feminino</option>
                          <option value="Outro">Outro</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {erros.genero}
                        </Form.Control.Feedback>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={3} className="mb-3">
                        <Form.Label>RG</Form.Label>
                        <Form.Control
                          type="text"
                          name="rg"
                          value={formData.rg}
                          onChange={handleChange}
                          isInvalid={!!erros.rg}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          {erros.rg}
                        </Form.Control.Feedback>
                      </Col>
                      <Col md={3} className="mb-3">
                        <Form.Label>CPF</Form.Label>
                        <Form.Control
                          type="text"
                          name="cpf"
                          value={formData.cpf}
                          onChange={handleChange}
                          isInvalid={!!erros.cpf}
                          maxLength="14"
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          {erros.cpf}
                        </Form.Control.Feedback>
                      </Col>
                      <Col md={3} className="mb-3">
                        <Form.Label>Cartão SUS</Form.Label>
                        <Form.Control
                          type="text"
                          name="cartaoSus"
                          value={formData.cartaoSus}
                          onChange={handleChange}
                          isInvalid={!!erros.cartaoSus}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          {erros.cartaoSus}
                        </Form.Control.Feedback>
                      </Col>
                      <Col md={3} className="mb-3">
                        <Form.Label>Telefone</Form.Label>
                        <Form.Control
                          type="tel"
                          name="telefone"
                          value={formData.telefone}
                          onChange={handleChange}
                          isInvalid={!!erros.telefone}
                          maxLength="15"
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          {erros.telefone}
                        </Form.Control.Feedback>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                <Card className="mb-4 secao-formulario">
                  <Card.Header>
                    <HouseFill className="me-2" /> Endereço
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Label>Rua</Form.Label>
                        <Form.Control
                          type="text"
                          name="rua"
                          value={formData.rua}
                          onChange={handleChange}
                          isInvalid={!!erros.rua}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          {erros.rua}
                        </Form.Control.Feedback>
                      </Col>
                      <Col md={2} className="mb-3">
                        <Form.Label>Número</Form.Label>
                        <Form.Control
                          type="text"
                          name="numero"
                          value={formData.numero}
                          onChange={handleChange}
                          isInvalid={!!erros.numero}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          {erros.numero}
                        </Form.Control.Feedback>
                      </Col>
                      <Col md={4} className="mb-3">
                        <Form.Label>Complemento</Form.Label>
                        <Form.Control
                          type="text"
                          name="complemento"
                          value={formData.complemento}
                          onChange={handleChange}
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col md={5} className="mb-3">
                        <Form.Label>Cidade</Form.Label>
                        <Form.Control
                          type="text"
                          name="cidade"
                          value={formData.cidade}
                          onChange={handleChange}
                          isInvalid={!!erros.cidade}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          {erros.cidade}
                        </Form.Control.Feedback>
                      </Col>
                      <Col md={3} className="mb-3">
                        <Form.Label>Estado</Form.Label>
                        <Form.Select
                          name="estado"
                          value={formData.estado}
                          onChange={handleChange}
                          isInvalid={!!erros.estado}
                          required
                        >
                          <option value="">Selecione</option>
                          {estadosBrasileiros.map(estado => (
                            <option key={estado} value={estado}>
                              {estado}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {erros.estado}
                        </Form.Control.Feedback>
                      </Col>
                      <Col md={4} className="mb-3">
                        <Form.Label>CEP</Form.Label>
                        <Form.Control
                          type="text"
                          name="cep"
                          value={formData.cep}
                          onChange={handleChange}
                          isInvalid={!!erros.cep}
                          maxLength="9"
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          {erros.cep}
                        </Form.Control.Feedback>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </>
            )}

            {editandoInternacao && (
              <Card className="mb-4 secao-formulario">
                <Card.Header>
                  <Hospital className="me-2" /> Dados de Internação
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={4} className="mb-3">
                      <Form.Label>Data de Entrada</Form.Label>
                      <Form.Control
                        type="date"
                        name="dataEntrada"
                        value={formData.dataEntrada}
                        onChange={handleChange}
                        isInvalid={!!errosInternacao.dataEntrada}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {errosInternacao.dataEntrada}
                      </Form.Control.Feedback>
                    </Col>
                    <Col md={4} className="mb-3">
                      <Form.Label>Quarto</Form.Label>
                      <Form.Select
                        name="quarto"
                        value={formData.quarto}
                        onChange={handleChangeInternacao}
                        isInvalid={!!errosInternacao.quarto}
                        required
                      >
                        <option value="">Selecione um quarto</option>
                        {quartosDisponiveis.map(quarto => (
                          <option key={quarto.id} value={quarto.id}>
                            Quarto {quarto.numero} (Capacidade: {quarto.capacidade})
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errosInternacao.quarto}
                      </Form.Control.Feedback>
                    </Col>
                    <Col md={4} className="mb-3">
                      <Form.Label>Cama</Form.Label>
                      <Form.Select
                        name="cama"
                        value={formData.cama}
                        onChange={handleChangeInternacao}
                        isInvalid={!!errosInternacao.cama}
                        required
                        disabled={!formData.quarto}
                      >
                        <option value="">
                          {!formData.quarto ? 'Selecione um quarto primeiro' : 'Selecione uma cama'}
                        </option>
                        {camasDisponiveis.map(cama => (
                          <option key={cama} value={cama}>Cama {cama}</option>
                        ))}
                      </Form.Select>
                      {formData.quarto && camasDisponiveis.length === 0 && (
                        <Form.Text className="text-warning">
                          Nenhuma cama disponível neste quarto
                        </Form.Text>
                      )}
                      <Form.Control.Feedback type="invalid">
                        {errosInternacao.cama}
                      </Form.Control.Feedback>
                    </Col>
                  </Row>
                  <Row>
                    <Col className="mb-3">
                      <Form.Label>Observações</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="observacoes"
                        value={formData.observacoes}
                        onChange={handleChange}
                      />
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}

            <div className="d-flex justify-content-end gap-2 mb-4">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/')}
                disabled={salvando}
              >
                Cancelar
              </Button>
              <Button variant="primary" type="submit" disabled={salvando}>
                {salvando ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    <span className="ms-2">Salvando...</span>
                  </>
                ) : editandoInternacao ? 'Salvar Internação' : 
                   estaEditando ? 'Atualizar Cadastro' : 'Salvar Cadastro'}
              </Button>
            </div>
          </Form>

          <Modal show={mostrarModalConfirmacao} onHide={() => setMostrarModalConfirmacao(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Confirmar {estaEditando ? 'Edição' : 'Cadastro'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>Tem certeza que deseja {estaEditando ? 'atualizar' : 'salvar'} os dados deste idoso?</p>
              <p className="fw-bold">{formData.nome}</p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setMostrarModalConfirmacao(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={confirmarEdicao} disabled={salvando}>
                {salvando ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    <span className="ms-2">Salvando...</span>
                  </>
                ) : 'Confirmar'}
              </Button>
            </Modal.Footer>
          </Modal>
        </Container>
      </div>
    </Lateral>
  );
};

export default SataCadastroIdosos;