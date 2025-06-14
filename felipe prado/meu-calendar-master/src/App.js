import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid/index.js';
import timeGridPlugin from '@fullcalendar/timegrid/index.js';
import interactionPlugin from '@fullcalendar/interaction/index.js';
import ptBrLocale from '@fullcalendar/core/locales/pt-br.js';

import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Form, Badge } from 'react-bootstrap';

const colorOptions = [
  { color: '#3788d8', label: 'Azul' },
  { color: '#e74c3c', label: 'Vermelho' },
  { color: '#2ecc71', label: 'Verde' },
  { color: '#f39c12', label: 'Laranja' },
  { color: '#9b59b6', label: 'Roxo' },
];

function App() {
  const [events, setEvents] = useState([]);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formMode, setFormMode] = useState('create'); // 'create' ou 'edit'
  
  // Estado unificado para formulário
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    color: '#3788d8',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    location: '',
    description: '',
    notify: false,
    notifyTime: '60',
    type: '',
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = () => {
    fetch('http://localhost:3001/eventos')
      .then(res => {
        if (!res.ok) throw new Error('Erro ao carregar eventos');
        return res.json();
      })
      .then(data => {
        setEvents(data);
      })
      .catch(err => {
        console.error(err);
        alert('Erro ao carregar eventos do servidor');
      });
  };

  const handleEventClick = (info) => {
    const event = events.find((e) => e.id === info.event.id);
    if (event) {
      setSelectedEvent(event);
      setShowViewModal(true);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      id: '',
      title: '',
      color: '#3788d8',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      location: '',
      description: '',
      notify: false,
      notifyTime: '60',
      type: '',
    });
  };

  const prepareEditForm = (event) => {
    const start = new Date(event.start);
    const end = new Date(event.end);

    setFormData({
      id: event.id,
      title: event.title,
      color: event.color || '#3788d8',
      startDate: start.toISOString().split('T')[0],
      startTime: start.toTimeString().substring(0, 5),
      endDate: end.toISOString().split('T')[0],
      endTime: end.toTimeString().substring(0, 5),
      location: event.location || '',
      description: event.description || '',
      notify: event.notify || false,
      notifyTime: event.notifyTime ? event.notifyTime.toString() : '60',
      type: event.type || '',
    });
  };

  const handleSaveEvent = () => {
    // Validar campos obrigatórios
    if (!formData.title || !formData.startDate || !formData.startTime || 
        !formData.endDate || !formData.endTime || !formData.location || 
        !formData.description) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    const start = new Date(`${formData.startDate}T${formData.startTime}`);
    const end = new Date(`${formData.endDate}T${formData.endTime}`);

    if (end <= start) {
      alert('A data/hora de término deve ser posterior à data/hora de início.');
      return;
    }

    const eventData = {
      title: formData.title,
      color: formData.color,
      start: start.toISOString(),
      end: end.toISOString(),
      location: formData.location,
      description: formData.description,
      notify: formData.notify,
      notifyTime: formData.notify ? parseInt(formData.notifyTime) : null,
      type: formData.type || 'Social',
    };

    const isEdit = formMode === 'edit';
    const url = isEdit 
      ? `http://localhost:3001/eventos/${formData.id}`
      : 'http://localhost:3001/eventos';
    const method = isEdit ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    })
      .then(res => {
        if (!res.ok) throw new Error('Erro ao salvar evento');
        return res.json();
      })
      .then(savedEvent => {
        if (isEdit) {
          setEvents(events.map(e => e.id === savedEvent.id ? savedEvent : e));
        } else {
          setEvents([...events, savedEvent]);
        }
        setShowAddEditModal(false);
        resetForm();
      })
      .catch(err => {
        console.error(err);
        alert('Erro ao salvar evento: ' + err.message);
      });
  };

  const handleDeleteEvent = (id) => {
    if (window.confirm('Deseja realmente excluir este evento?')) {
      fetch(`http://localhost:3001/eventos/${id}`, {
        method: 'DELETE',
      })
        .then(res => {
          if (!res.ok) throw new Error('Erro ao deletar evento');
          setEvents(events.filter(e => e.id !== id));
          if (selectedEvent && selectedEvent.id === id) {
            setShowViewModal(false);
          }
        })
        .catch(err => {
          console.error(err);
          alert('Erro ao deletar evento: ' + err.message);
        });
    }
  };

  const getBadgeColor = (type) => {
    if (!type) return 'secondary';
    switch (type.toLowerCase()) {
      case 'social': return 'primary';
      case 'educativo': return 'success';
      case 'celebração': 
      case 'celebracao': return 'info';
      default: return 'secondary';
    }
  };

  const upcomingEvents = events
    .filter(e => new Date(e.start) >= new Date())
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 5);

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div
        className="sidebar p-3"
        style={{
          backgroundColor: '#2c3e50',
          color: 'white',
          height: '100vh',
          position: 'fixed',
          width: '250px',
        }}
      >
        <div className="d-flex align-items-center mb-4">
          <h4 className="m-0">SATA</h4>
        </div>
        <ul className="nav flex-column">
          <li className="nav-item">
            <button
              className="nav-link text-white btn btn-link p-0"
              onClick={() => alert('Menu Dashboard clicado!')}
              type="button"
            >
              <i className="bi bi-speedometer2"></i> Dashboard
            </button>
          </li>
        </ul>
      </div>

      {/* Main content */}
      <div
        className="main-content flex-grow-1"
        style={{ marginLeft: '250px', padding: '20px' }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Gerenciamento de Eventos</h2>
          <Button variant="primary" onClick={() => {
            resetForm();
            setFormMode('create');
            setShowAddEditModal(true);
          }}>
            <i className="bi bi-plus-circle"></i> Novo Evento
          </Button>
        </div>

        <div className="row mb-4">
          <div className="col-md-8">
            <div className="card">
              <div className="card-body">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  locale={ptBrLocale}
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay',
                  }}
                  events={events.map(e => ({
                    id: e.id,
                    title: e.title,
                    start: e.start,
                    end: e.end,
                    color: e.color,
                    extendedProps: {
                      location: e.location,
                      description: e.description,
                    },
                  }))}
                  eventClick={handleEventClick}
                  eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  }}
                  height="auto"
                />
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Próximos Eventos</h5>
              </div>
              <div className="card-body">
                {upcomingEvents.length === 0 ? (
                  <p>Nenhum evento próximo.</p>
                ) : (
                  upcomingEvents.map(ev => (
                    <div
                      key={ev.id}
                      className="event-card card mb-3"
                      style={{ borderLeftColor: ev.color, cursor: 'default' }}
                    >
                      <div className="card-body">
                        <h5 className="card-title">{ev.title}</h5>
                        <p className="card-text mb-1">
                          <i className="bi bi-calendar-date"></i>
                          {new Date(ev.start).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="card-text mb-1">
                          <i className="bi bi-clock"></i>
                          {new Date(ev.start).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })}{' '}
                          -{' '}
                          {new Date(ev.end).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })}
                        </p>
                        <p className="card-text">
                          <i className="bi bi-geo-alt"></i> {ev.location}
                        </p>
                        <div className="d-flex justify-content-end">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-1"
                            onClick={() => {
                              prepareEditForm(ev);
                              setFormMode('edit');
                              setShowAddEditModal(true);
                            }}
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteEvent(ev.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Adicionar/Editar Evento */}
      <Modal show={showAddEditModal} onHide={() => setShowAddEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{formMode === 'edit' ? 'Editar Evento' : 'Novo Evento'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="formTitle">
              <Form.Label>Título*</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formColor">
              <Form.Label>Cor</Form.Label>
              <Form.Select
                name="color"
                value={formData.color}
                onChange={handleInputChange}
              >
                {colorOptions.map(opt => (
                  <option key={opt.color} value={opt.color}>{opt.label}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formStartDate">
              <Form.Label>Data de Início*</Form.Label>
              <Form.Control
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formStartTime">
              <Form.Label>Hora de Início*</Form.Label>
              <Form.Control
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formEndDate">
              <Form.Label>Data de Término*</Form.Label>
              <Form.Control
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formEndTime">
              <Form.Label>Hora de Término*</Form.Label>
              <Form.Control
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formLocation">
              <Form.Label>Localização*</Form.Label>
              <Form.Control
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formDescription">
              <Form.Label>Descrição*</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formNotify">
              <Form.Check
                type="checkbox"
                label="Notificar antes do evento"
                name="notify"
                checked={formData.notify}
                onChange={handleInputChange}
              />
            </Form.Group>

            {formData.notify && (
              <Form.Group className="mb-3" controlId="formNotifyTime">
                <Form.Label>Minutos antes para notificação</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  name="notifyTime"
                  value={formData.notifyTime}
                  onChange={handleInputChange}
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3" controlId="formType">
              <Form.Label>Tipo de Evento</Form.Label>
              <Form.Select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
              >
                <option value="">Selecione</option>
                <option value="Social">Social</option>
                <option value="Educativo">Educativo</option>
                <option value="Celebração">Celebração</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddEditModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveEvent}>
            Salvar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para Visualizar Evento */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedEvent?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEvent && (
            <>
              <p><strong>Data:</strong> {new Date(selectedEvent.start).toLocaleDateString('pt-BR')}</p>
              <p>
                <strong>Hora:</strong>{' '}
                {new Date(selectedEvent.start).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}{' '}
                -{' '}
                {new Date(selectedEvent.end).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </p>
              <p><strong>Localização:</strong> {selectedEvent.location}</p>
              <p><strong>Descrição:</strong> {selectedEvent.description}</p>
              <p>
                <strong>Tipo:</strong>{' '}
                <Badge bg={getBadgeColor(selectedEvent.type)}>{selectedEvent.type}</Badge>
              </p>
              <p>
                <strong>Notificação:</strong>{' '}
                {selectedEvent.notify ? `Sim, ${selectedEvent.notifyTime} minutos antes` : 'Não'}
              </p>
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
              if (selectedEvent) {
                prepareEditForm(selectedEvent);
                setFormMode('edit');
                setShowViewModal(false);
                setShowAddEditModal(true);
              }
            }}
          >
            Editar
          </Button>
          <Button
            variant="danger"
            onClick={() => selectedEvent && handleDeleteEvent(selectedEvent.id)}
          >
            Excluir
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default App;