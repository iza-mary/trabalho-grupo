import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Modal, 
  Form, 
  Badge,
  Alert
} from 'react-bootstrap';
import { 
  PlusCircle, 
  Pencil, 
  Trash, 
  Eye, 
  CalendarEvent,
  GeoAlt,
  Clock
} from 'react-bootstrap-icons';
import Lateral from './components/Lateral';
import './styles/Eventos.css';

const colorOptions = [
  { color: '#3788d8', label: 'Azul' },
  { color: '#e74c3c', label: 'Vermelho' },
  { color: '#2ecc71', label: 'Verde' },
  { color: '#f39c12', label: 'Laranja' },
  { color: '#9b59b6', label: 'Roxo' },
];

const tiposEvento = [
  { value: 'Social', label: 'Social' },
  { value: 'Educativo', label: 'Educativo' },
  { value: 'Celebração', label: 'Celebração' },
  { value: 'Saúde', label: 'Saúde' },
  { value: 'Recreativo', label: 'Recreativo' }
];

function GerenciarEventos() {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState(null);

  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'Social',
    cor: '#3788d8',
    dataInicio: '',
    dataFim: '',
    horaInicio: '',
    horaFim: '',
    local: '',
    descricao: '',
    notificar: false,
    tempoNotificacao: '60'
  });

  useEffect(() => {
    carregarEventos();
  }, []);

  const carregarEventos = async () => {
    try {
      setCarregando(true);
      // Simulação de chamada à API - substituir pela implementação real
      const eventosMock = [
        {
          id: 1,
          titulo: 'Festa Junina',
          tipo: 'Social',
          cor: '#3788d8',
          dataInicio: '2023-06-10',
          dataFim: '2023-06-10',
          horaInicio: '14:00',
          horaFim: '18:00',
          local: 'Pátio Principal',
          descricao: 'Festa tradicional com comidas típicas, música e dança para todos os residentes.',
          notificar: true,
          tempoNotificacao: 60
        },
        {
          id: 2,
          titulo: 'Palestra sobre Saúde',
          tipo: 'Educativo',
          cor: '#e74c3c',
          dataInicio: '2023-06-15',
          dataFim: '2023-06-15',
          horaInicio: '10:00',
          horaFim: '11:30',
          local: 'Auditório',
          descricao: 'Palestra informativa sobre cuidados com a saúde na terceira idade.',
          notificar: true,
          tempoNotificacao: 1440
        }
      ];
      setEvents(eventosMock);
    } catch (error) {
      setErroCarregamento('Erro ao carregar eventos. Tente novamente.');
      console.error('Erro ao carregar eventos:', error);
    } finally {
      setCarregando(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const limparFormulario = () => {
    setFormData({
      titulo: '',
      tipo: 'Social',
      cor: '#3788d8',
      dataInicio: '',
      dataFim: '',
      horaInicio: '',
      horaFim: '',
      local: '',
      descricao: '',
      notificar: false,
      tempoNotificacao: '60'
    });
    setModoEdicao(false);
    setEventoSelecionado(null);
  };

  const prepararEdicao = (evento) => {
    setFormData({
      titulo: evento.titulo,
      tipo: evento.tipo,
      cor: evento.cor,
      dataInicio: evento.dataInicio,
      dataFim: evento.dataFim,
      horaInicio: evento.horaInicio,
      horaFim: evento.horaFim,
      local: evento.local,
      descricao: evento.descricao,
      notificar: evento.notificar,
      tempoNotificacao: evento.tempoNotificacao.toString()
    });
    setEventoSelecionado(evento);
    setModoEdicao(true);
    setShowModal(true);
  };

  const visualizarEvento = (evento) => {
    setEventoSelecionado(evento);
    setShowViewModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modoEdicao) {
        // Atualizar evento existente
        const eventosAtualizados = events.map(e => 
          e.id === eventoSelecionado.id 
            ? { ...eventoSelecionado, ...formData, tempoNotificacao: parseInt(formData.tempoNotificacao) }
            : e
        );
        setEvents(eventosAtualizados);
      } else {
        // Adicionar novo evento
        const novoEvento = {
          id: Math.max(...events.map(e => e.id), 0) + 1,
          ...formData,
          tempoNotificacao: parseInt(formData.tempoNotificacao)
        };
        setEvents([...events, novoEvento]);
      }
      
      setShowModal(false);
      limparFormulario();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      alert('Erro ao salvar evento. Tente novamente.');
    }
  };

  const handleExcluirEvento = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este evento?')) {
      setEvents(events.filter(evento => evento.id !== id));
      if (eventoSelecionado && eventoSelecionado.id === id) {
        setShowViewModal(false);
      }
    }
  };

  const getEventosProximos = () => {
    return events
      .filter(evento => new Date(evento.dataInicio) >= new Date())
      .sort((a, b) => new Date(a.dataInicio) - new Date(b.dataInicio))
      .slice(0, 3);
  };

  const getCorBadge = (tipo) => {
    switch (tipo) {
      case 'Social': return 'primary';
      case 'Educativo': return 'success';
      case 'Celebração': return 'info';
      case 'Saúde': return 'warning';
      case 'Recreativo': return 'secondary';
      default: return 'secondary';
    }
  };

  const eventosFullCalendar = events.map(evento => ({
    id: evento.id.toString(),
    title: evento.titulo,
    start: `${evento.dataInicio}T${evento.horaInicio}:00`,
    end: `${evento.dataFim}T${evento.horaFim}:00`,
    color: evento.cor,
    extendedProps: {
      local: evento.local,
      descricao: evento.descricao,
      tipo: evento.tipo
    }
  }));

  if (carregando) {
    return (
      <Lateral>
        <Container fluid className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <Alert variant="info">Carregando eventos...</Alert>
        </Container>
      </Lateral>
    );
  }

  return (
    <Lateral>
      <div className="content-area">
        <Container fluid>
          <Row className="mb-4 linha-cabecalho">
            <Col className="d-flex justify-content-between align-items-center">
              <h2>Gerenciamento de Eventos</h2>
              <Button 
                variant="primary"
                onClick={() => setShowModal(true)}
              >
                <PlusCircle className="me-1" /> Novo Evento
              </Button>
            </Col>
          </Row>

          {erroCarregamento && (
            <Alert variant="danger" className="mb-4">
              {erroCarregamento}
            </Alert>
          )}

          <Row className="mb-4">
            <Col md={8}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">
                    <CalendarEvent className="me-2" /> Calendário de Eventos
                  </h5>
                </Card.Header>
                <Card.Body>
                  <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    locale={ptBrLocale}
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    events={eventosFullCalendar}
                    eventClick={(info) => {
                      const evento = events.find(e => e.id === parseInt(info.event.id));
                      if (evento) visualizarEvento(evento);
                    }}
                    height="auto"
                  />
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Próximos Eventos</h5>
                </Card.Header>
                <Card.Body>
                  {getEventosProximos().length === 0 ? (
                    <Alert variant="info" className="mb-0">
                      Nenhum evento próximo.
                    </Alert>
                  ) : (
                    getEventosProximos().map(evento => (
                      <Card 
                        key={evento.id} 
                        className="mb-3 event-card"
                        style={{ borderLeft: `4px solid ${evento.cor}` }}
                      >
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="mb-0">{evento.titulo}</h6>
                            <Badge bg={getCorBadge(evento.tipo)}>{evento.tipo}</Badge>
                          </div>
                          <p className="mb-1">
                            <Clock size={14} className="me-1" />
                            {new Date(evento.dataInicio).toLocaleDateString('pt-BR')} • {evento.horaInicio} - {evento.horaFim}
                          </p>
                          <p className="mb-2">
                            <GeoAlt size={14} className="me-1" />
                            {evento.local}
                          </p>
                          <div className="d-flex justify-content-end">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => visualizarEvento(evento)}
                            >
                              <Eye />
                            </Button>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              className="me-2"
                              onClick={() => prepararEdicao(evento)}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleExcluirEvento(evento.id)}
                            >
                              <Trash />
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    ))
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card>
            <Card.Header>
              <h5 className="mb-0">Todos os Eventos</h5>
            </Card.Header>
            <Card.Body>
              {events.length === 0 ? (
                <Alert variant="info" className="mb-0">
                  Nenhum evento cadastrado.
                </Alert>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th>Título</th>
                        <th>Data</th>
                        <th>Horário</th>
                        <th>Local</th>
                        <th>Tipo</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map(evento => (
                        <tr key={evento.id}>
                          <td>{evento.titulo}</td>
                          <td>{new Date(evento.dataInicio).toLocaleDateString('pt-BR')}</td>
                          <td>{evento.horaInicio} - {evento.horaFim}</td>
                          <td>{evento.local}</td>
                          <td>
                            <Badge bg={getCorBadge(evento.tipo)}>
                              {evento.tipo}
                            </Badge>
                          </td>
                          <td>
                            <div className="botoes-acao">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                title="Visualizar"
                                onClick={() => visualizarEvento(evento)}
                              >
                                <Eye />
                              </Button>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                title="Editar"
                                onClick={() => prepararEdicao(evento)}
                              >
                                <Pencil />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                title="Excluir"
                                onClick={() => handleExcluirEvento(evento.id)}
                              >
                                <Trash />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Modal para Adicionar/Editar Evento */}
          <Modal show={showModal} onHide={() => { setShowModal(false); limparFormulario(); }} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>{modoEdicao ? 'Editar Evento' : 'Novo Evento'}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
              <Modal.Body>
                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label>Título do Evento*</Form.Label>
                      <Form.Control
                        type="text"
                        name="titulo"
                        value={formData.titulo}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tipo de Evento*</Form.Label>
                      <Form.Select
                        name="tipo"
                        value={formData.tipo}
                        onChange={handleInputChange}
                        required
                      >
                        {tiposEvento.map(tipo => (
                          <option key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Cor de Destaque</Form.Label>
                  <div className="d-flex gap-2">
                    {colorOptions.map(opt => (
                      <div
                        key={opt.color}
                        className={`color-option ${formData.cor === opt.color ? 'selected' : ''}`}
                        style={{ backgroundColor: opt.color }}
                        onClick={() => setFormData({...formData, cor: opt.color})}
                        title={opt.label}
                      />
                    ))}
                  </div>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Data de Início*</Form.Label>
                      <Form.Control
                        type="date"
                        name="dataInicio"
                        value={formData.dataInicio}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Data de Término*</Form.Label>
                      <Form.Control
                        type="date"
                        name="dataFim"
                        value={formData.dataFim}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Hora de Início*</Form.Label>
                      <Form.Control
                        type="time"
                        name="horaInicio"
                        value={formData.horaInicio}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Hora de Término*</Form.Label>
                      <Form.Control
                        type="time"
                        name="horaFim"
                        value={formData.horaFim}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Local*</Form.Label>
                  <Form.Control
                    type="text"
                    name="local"
                    value={formData.local}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Descrição*</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Notificar participantes?"
                    name="notificar"
                    checked={formData.notificar}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                {formData.notificar && (
                  <Form.Group className="mb-3">
                    <Form.Label>Antecedência para Notificação*</Form.Label>
                    <Form.Select
                      name="tempoNotificacao"
                      value={formData.tempoNotificacao}
                      onChange={handleInputChange}
                    >
                      <option value="15">15 minutos antes</option>
                      <option value="30">30 minutos antes</option>
                      <option value="60">1 hora antes</option>
                      <option value="1440">1 dia antes</option>
                      <option value="2880">2 dias antes</option>
                    </Form.Select>
                  </Form.Group>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => { setShowModal(false); limparFormulario(); }}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit">
                  {modoEdicao ? 'Atualizar Evento' : 'Salvar Evento'}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>

          {/* Modal para Visualizar Evento */}
          <Modal show={showViewModal} onHide={() => setShowViewModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>{eventoSelecionado?.titulo}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {eventoSelecionado && (
                <>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <Badge bg={getCorBadge(eventoSelecionado.tipo)}>
                      {eventoSelecionado.tipo}
                    </Badge>
                    <div style={{ 
                      width: '20px', 
                      height: '20px', 
                      backgroundColor: eventoSelecionado.cor,
                      borderRadius: '4px'
                    }} />
                  </div>
                  
                  <p><strong>Data:</strong> {new Date(eventoSelecionado.dataInicio).toLocaleDateString('pt-BR')}</p>
                  
                  <p>
                    <strong>Horário:</strong> {eventoSelecionado.horaInicio} - {eventoSelecionado.horaFim}
                  </p>
                  
                  <p><strong>Local:</strong> {eventoSelecionado.local}</p>
                  
                  <p><strong>Descrição:</strong></p>
                  <p>{eventoSelecionado.descricao}</p>
                  
                  {eventoSelecionado.notificar && (
                    <Alert variant="info" className="mt-3">
                      Os participantes serão notificados {eventoSelecionado.tempoNotificacao >= 60 
                        ? eventoSelecionado.tempoNotificacao >= 1440 
                          ? `${eventoSelecionado.tempoNotificacao / 1440} dias antes` 
                          : `${eventoSelecionado.tempoNotificacao / 60} horas antes`
                        : `${eventoSelecionado.tempoNotificacao} minutos antes`}.
                    </Alert>
                  )}
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowViewModal(false)}>
                Fechar
              </Button>
              <Button 
                variant="primary" 
                onClick={() => {
                  setShowViewModal(false);
                  prepararEdicao(eventoSelecionado);
                }}
              >
                Editar
              </Button>
            </Modal.Footer>
          </Modal>
        </Container>
      </div>
    </Lateral>
  );
}

export default GerenciarEventos;