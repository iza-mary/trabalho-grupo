import { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Button, Form, Modal, Badge, Card, Table, Alert, InputGroup } from 'react-bootstrap';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptLocale from '@fullcalendar/core/locales/pt-br';
import { CalendarEvent, PlusCircle, Pencil, Trash, Funnel, Search, Calendar3, Clock, GeoAlt } from 'react-bootstrap-icons';
import eventoService from '../services/eventoService';
import Navbar from '../components/Navbar';
import PageHeader from '../components/ui/PageHeader';
import '../styles/Eventos.css';
import StandardTable from '../components/ui/StandardTable';
import ActionIconButton from '../components/ui/ActionIconButton';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Importações de CSS do FullCalendar para garantir renderização correta



export default function Eventos() {
  const [eventos, setEventos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modo, setModo] = useState('criar'); // criar | editar | visualizar
  const [eventoSelecionado, setEventoSelecionado] = useState(null);

  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'Geral',
    cor: '#3788d8',
    dataInicio: '',
    dataFim: '',
    horaInicio: '',
    horaFim: '',
    local: '',
    descricao: '',
    notificar: false,
    tempoNotificacao: 60,
  });

  // Filtros
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [ordenacao, setOrdenacao] = useState('data_desc');

  useEffect(() => {
    (async () => {
      const lista = await eventoService.getAll();
      setEventos(lista);
    })();
  }, []);

  const eventosCalendar = useMemo(() => {
    const addOneDay = (dateStr) => {
      try {
        const base = new Date(`${dateStr}T00:00:00`);
        const next = new Date(base);
        next.setDate(base.getDate() + 1);
        const y = next.getFullYear();
        const m = String(next.getMonth() + 1).padStart(2, '0');
        const d = String(next.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      } catch {
        return dateStr;
      }
    };

    const normTime = (t) => {
      if (!t) return '';
      // Garante formato HH:mm:ss quando vier HH:mm
      return t.length === 5 ? `${t}:00` : t;
    };

    const toDateTime = (dateStr, timeStr) => {
      try {
        return new Date(`${dateStr}T${normTime(timeStr)}`);
      } catch {
        return null;
      }
    };

    const ensurePositiveDuration = (startDT, endDT) => {
      if (!startDT || !endDT) return endDT;
      if (endDT.getTime() <= startDT.getTime()) {
        return new Date(startDT.getTime() + 60 * 1000);
      }
      return endDT;
    };

    return eventos.map(e => {
      const hasStartTime = !!e.horaInicio;
      const hasEndTime = !!e.horaFim;

      if (hasStartTime) {
        const startDT = toDateTime(e.dataInicio, e.horaInicio);
        let endDT = hasEndTime ? toDateTime(e.dataFim, e.horaFim) : null;
        endDT = ensurePositiveDuration(startDT, endDT);

        return {
          id: e.id,
          title: e.titulo,
          start: startDT || e.dataInicio,
          ...(endDT ? { end: endDT } : {}),
          allDay: false,
          color: e.cor,
          extendedProps: { ...e },
        };
      }

      // Sem hora de início: trata como all-day
      let end;
      if (e.dataFim && e.dataFim !== e.dataInicio) {
        end = addOneDay(e.dataFim);
      }

      return {
        id: e.id,
        title: e.titulo,
        start: e.dataInicio,
        ...(end ? { end } : {}),
        allDay: true,
        color: e.cor,
        extendedProps: { ...e },
      };
    });
  }, [eventos]);

  const eventosProximos = useMemo(() => {
    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

    const normTime = (t) => {
      if (!t) return '';
      return t.length === 5 ? `${t}:00` : t;
    };
    const toDateTime = (dateStr, timeStr) => {
      try {
        return new Date(`${dateStr}T${normTime(timeStr)}`);
      } catch {
        return null;
      }
    };
    const ensurePositiveDuration = (startDT, endDT) => {
      if (!startDT || !endDT) return endDT;
      if (endDT.getTime() <= startDT.getTime()) {
        return new Date(startDT.getTime() + 60 * 1000);
      }
      return endDT;
    };

    const mapWithTimes = (e) => {
      const startDT = toDateTime(e.dataInicio, e.horaInicio || '00:00:00');
      let endDT = null;
      if (e.dataFim) {
        endDT = toDateTime(e.dataFim, e.horaFim || '23:59:59');
      } else if (e.horaFim) {
        endDT = toDateTime(e.dataInicio, e.horaFim || '23:59:59');
      }
      endDT = ensurePositiveDuration(startDT, endDT);
      return { ...e, _start: startDT, _end: endDT };
    };

    return (Array.isArray(eventos) ? eventos : [])
      .map(mapWithTimes)
      .filter(e => {
        if (!e._start && !e._end) return false;
        const startsSoon = e._start ? e._start >= inicioHoje : false;
        const ongoing = e._end ? e._end >= inicioHoje : false;
        return startsSoon || ongoing;
      })
      .sort((a, b) => {
        const aStart = a._start?.getTime() ?? 0;
        const bStart = b._start?.getTime() ?? 0;
        if (aStart !== bStart) return aStart - bStart;
        const aEnd = a._end?.getTime() ?? 0;
        const bEnd = b._end?.getTime() ?? 0;
        return aEnd - bEnd;
      })
      .slice(0, 6);
  }, [eventos]);

  const eventosFiltradosOrdenados = useMemo(() => {
    let lista = Array.isArray(eventos) ? [...eventos] : [];

    // Tipo
    if (filtroTipo) {
      const ft = filtroTipo.toLowerCase();
      lista = lista.filter(e => (e.tipo || '').toLowerCase().includes(ft));
    }

    // Busca por título, descrição ou local
    if (termoBusca) {
      const t = termoBusca.toLowerCase();
      lista = lista.filter(e => {
        return (
          (e.titulo || '').toLowerCase().includes(t) ||
          (e.descricao || '').toLowerCase().includes(t) ||
          (e.local || '').toLowerCase().includes(t)
        );
      });
    }

    // Intervalo de datas
    const parseDate = (dStr) => {
      if (!dStr) return null;
      const d = new Date(dStr);
      return isNaN(d.getTime()) ? null : d;
    };
    const di = parseDate(filtroDataInicio);
    const df = parseDate(filtroDataFim);
    if (di) {
      lista = lista.filter(e => {
        const start = parseDate(e.dataInicio) || parseDate(e.dataFim);
        return start ? start >= di : true;
      });
    }
    if (df) {
      lista = lista.filter(e => {
        const end = parseDate(e.dataFim) || parseDate(e.dataInicio);
        return end ? end <= df : true;
      });
    }

    // Ordenação
    switch (ordenacao) {
      case 'data_asc': {
        lista.sort((a, b) => {
          const aStart = parseDate(a.dataInicio) || parseDate(a.dataFim) || new Date('9999-12-31');
          const bStart = parseDate(b.dataInicio) || parseDate(b.dataFim) || new Date('9999-12-31');
          return aStart - bStart;
        });
        break;
      }
      case 'data_desc': {
        lista.sort((a, b) => {
          const aStart = parseDate(a.dataInicio) || parseDate(a.dataFim) || new Date('0001-01-01');
          const bStart = parseDate(b.dataInicio) || parseDate(b.dataFim) || new Date('0001-01-01');
          return bStart - aStart;
        });
        break;
      }
      case 'titulo_asc': {
        lista.sort((a, b) => (a.titulo || '').localeCompare(b.titulo || ''));
        break;
      }
      case 'titulo_desc': {
        lista.sort((a, b) => (b.titulo || '').localeCompare(a.titulo || ''));
        break;
      }
      default:
        break;
    }

    return lista;
  }, [eventos, filtroTipo, termoBusca, filtroDataInicio, filtroDataFim, ordenacao]);

  const formatDateBR = (raw) => {
    if (!raw) return '—';
    // se vier como YYYY-MM-DD, evita timezone
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [y, m, d] = raw.split('-');
      return `${d}/${m}/${y}`;
    }
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('pt-BR');
    } catch {
      return '—';
    }
  };

  const formatHora = (inicio, fim) => {
    if (inicio && fim) return `${inicio} - ${fim}`;
    return inicio || '—';
  };

  const getTipoBadgeVariant = (tipo) => {
    const t = (tipo || '').toLowerCase();
    if (t.includes('social')) return 'primary';
    if (t.includes('educ')) return 'success';
    if (t.includes('cele')) return 'info';
    return 'secondary';
  };

  function abrirCriar(dateInfo) {
    setModo('criar');
    setEventoSelecionado(null);
    setFormData(prev => ({
      ...prev,
      dataInicio: dateInfo?.dateStr || '',
      dataFim: dateInfo?.dateStr || '',
    }));
    setShowModal(true);
  }

  // Novo: modal de eventos do dia
  const [showDiaModal, setShowDiaModal] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState('');

  // Estado para confirmação de exclusão
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [eventoParaExcluir, setEventoParaExcluir] = useState(null);

  function abrirConfirmarExclusao(ev) {
    setEventoParaExcluir(ev);
    setEventoSelecionado(ev);
    setShowConfirmDelete(true);
  }

  async function confirmarExclusaoEvento() {
    if (!eventoParaExcluir?.id) {
      setShowConfirmDelete(false);
      return;
    }
    try {
      const lista = await eventoService.remove(eventoParaExcluir.id);
      setEventos(lista);
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Falha ao excluir o evento');
    } finally {
      setShowConfirmDelete(false);
      setEventoParaExcluir(null);
      setShowModal(false);
    }
  }

  // Lista de eventos do dia selecionado (dentro do componente)
  const eventosDoDia = useMemo(() => {
    if (!diaSelecionado) return [];
    const dia = diaSelecionado; // formato YYYY-MM-DD
    const isBetween = (start, end, target) => {
      const s = start || '';
      const f = end || start || '';
      return s <= target && target <= f;
    };
    return (Array.isArray(eventos) ? eventos : []).filter(e => isBetween(e.dataInicio, e.dataFim, dia));
  }, [eventos, diaSelecionado]);

  function abrirDia(dateInfo) {
    const diaStr = dateInfo?.dateStr || '';
    setDiaSelecionado(diaStr);
    setShowDiaModal(true);
  }

  function criarEventoNoDia() {
    const diaStr = diaSelecionado || '';
    setModo('criar');
    setEventoSelecionado(null);
    setFormData(prev => ({ ...prev, dataInicio: diaStr, dataFim: diaStr }));
    setShowDiaModal(false);
    setShowModal(true);
  }

  function abrirEditar(evento) {
    const props = evento;
    setModo('editar');
    setEventoSelecionado(props);
    setFormData({
      titulo: props.titulo,
      tipo: props.tipo,
      cor: props.cor,
      dataInicio: props.dataInicio,
      dataFim: props.dataFim,
      horaInicio: props.horaInicio || '',
      horaFim: props.horaFim || '',
      local: props.local || '',
      descricao: props.descricao || '',
      notificar: !!props.notificar,
      tempoNotificacao: props.tempoNotificacao || 60,
    });
    setShowModal(true);
  }

  function abrirVisualizar(clickInfo) {
    const props = clickInfo.event.extendedProps;
    setModo('visualizar');
    setEventoSelecionado(props);
    setShowModal(true);
  }

  function abrirVisualizarEvento(ev) {
    setModo('visualizar');
    setEventoSelecionado(ev);
    setShowModal(true);
  }

  async function salvar() {
    const payload = { ...formData };
    if (!payload.titulo || payload.titulo.trim() === '') {
      alert('Título é obrigatório');
      return;
    }
    try {
      if (modo === 'criar') {
        const lista = await eventoService.create(payload);
        setEventos(lista);
      } else if (modo === 'editar' && eventoSelecionado?.id) {
        const lista = await eventoService.update(eventoSelecionado.id, payload);
        setEventos(lista);
      }
      setShowModal(false);
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Falha ao salvar o evento');
    }
  }


  function limparForm() {
    setFormData({
      titulo: '', tipo: 'Geral', cor: '#3788d8', dataInicio: '', dataFim: '', horaInicio: '', horaFim: '', local: '', descricao: '', notificar: false, tempoNotificacao: 60
    });
  }


  return (
    <Navbar>
    <Container fluid className="eventos-page">
      <PageHeader
        title="Eventos"
        icon={<CalendarEvent />}
        actions={
          <Button
            variant="primary"
            onClick={() => abrirCriar()}
            className="d-inline-flex align-items-center"
          >
            <PlusCircle className="me-1" size={16} />
            Novo Evento
          </Button>
        }
      />

      <Row className="g-2">
        <Col lg={8} md={7} sm={12} className="calendar-wrapper">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              locales={[ptLocale]}
              locale="pt-br"
              height="auto"
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              nowIndicator={true}
              navLinks={true}
              eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
              slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
              events={eventosCalendar}
              dateClick={abrirDia}
              eventClick={(clickInfo) => abrirVisualizar(clickInfo)}
              eventDidMount={(info) => {
                const e = info.event;
                const fmt = (d) => d ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
                const start = fmt(e.start);
                const end = fmt(e.end);
                const timeStr = start && end ? `${start} - ${end}` : (start || '');
                const desc = e.extendedProps?.descricao ? `\n${e.extendedProps.descricao}` : '';
                info.el.setAttribute('title', `${e.title}${timeStr ? `\n${timeStr}` : ''}${desc}`);
              }}
            />
        </Col>
        <Col lg={4} md={5} sm={12}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Próximos Eventos</h5>
            </Card.Header>
            <Card.Body>
              {eventosProximos.length === 0 ? (
                <p className="text-muted mb-0">Nenhum evento próximo.</p>
              ) : (
                <div className="proximos-eventos-list">
                  {eventosProximos.map(ev => (
                    <div
                      key={ev.id}
                      className="proximo-evento-card"
                      style={{ borderLeftColor: ev.cor }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Ver detalhes do evento ${ev.titulo}`}
                      onClick={() => abrirVisualizarEvento(ev)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          abrirVisualizarEvento(ev);
                        }
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="evento-infos">
                          <div className="evento-titulo fw-semibold mb-2">{ev.titulo}</div>
                          <div className="evento-meta"><Calendar3 className="me-2" size={16} />{formatDateBR(ev.dataInicio)}</div>
                          <div className="evento-meta"><Clock className="me-2" size={16} />{ev.horaInicio ? (ev.horaFim ? `${ev.horaInicio} - ${ev.horaFim}` : ev.horaInicio) : '—'}</div>
                          <div className="evento-meta"><GeoAlt className="me-2" size={16} />{ev.local || '—'}</div>
                        </div>
                        <div className="botoes-acao" onClick={(e) => e.stopPropagation()}>
                          <ActionIconButton
                            variant="outline-primary"
                            size="sm"
                            title="Editar"
                            ariaLabel={`Editar ${ev.titulo}`}
                            onClick={(e) => { e.stopPropagation(); abrirEditar(ev); }}
                          >
                            <Pencil />
                          </ActionIconButton>
                          <ActionIconButton
                            variant="outline-danger"
                            size="sm"
                            title="Excluir"
                            ariaLabel={`Excluir ${ev.titulo}`}
                            onClick={(e) => { e.stopPropagation(); abrirConfirmarExclusao(ev); }}
                            className="ms-2"
                          >
                            <Trash />
                          </ActionIconButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filtros e Busca — padrão consistente */}
      <Card className="mb-2">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Filtros e Busca</h5>
          <button
            type="button"
            className="btn-sm btn btn-outline-secondary"
            data-bs-toggle="collapse"
            data-bs-target="#filtrosEventos"
            title="Mostrar/ocultar filtros"
          >
            <Funnel className="me-1" size={16} /> Filtros
          </button>
        </Card.Header>
        <Card.Body className="collapse show" id="filtrosEventos">
          <Row>
            <Col md={3} className="mb-3">
              <Form.Label>Tipo</Form.Label>
              <Form.Select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} aria-label="Filtrar por tipo de evento">
                <option value="">Todos</option>
                <option value="Geral">Geral</option>
                <option value="Social">Social</option>
                <option value="Educativo">Educativo</option>
                <option value="Saúde">Saúde</option>
              </Form.Select>
            </Col>
            <Col md={3} className="mb-3">
              <Form.Label>Ordenar por</Form.Label>
              <Form.Select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)} aria-label="Ordenar lista">
                <option value="data_desc">Data (Mais recente)</option>
                <option value="data_asc">Data (Mais antigo)</option>
                <option value="titulo_asc">Título (A-Z)</option>
                <option value="titulo_desc">Título (Z-A)</option>
              </Form.Select>
            </Col>
            <Col md={3} className="mb-3">
              <Form.Label>Data inicial</Form.Label>
              <Form.Control type="date" value={filtroDataInicio} onChange={(e) => setFiltroDataInicio(e.target.value)} aria-label="Filtrar a partir desta data" />
            </Col>
            <Col md={3} className="mb-3">
              <Form.Label>Data final</Form.Label>
              <Form.Control type="date" value={filtroDataFim} onChange={(e) => setFiltroDataFim(e.target.value)} aria-label="Filtrar até esta data" />
            </Col>
            <Col md={12} className="mb-2">
              <Form.Label>Buscar</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Título, descrição ou local..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  aria-label="Campo de busca"
                />
                <InputGroup.Text><Search size={16} /></InputGroup.Text>
              </InputGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Novo: Modal do Dia para criar e visualizar eventos do dia */}
      <Modal show={showDiaModal} onHide={() => setShowDiaModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Eventos em {formatDateBR(diaSelecionado)}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">Agendados</h6>
            <Button variant="primary" onClick={criarEventoNoDia} className="d-inline-flex align-items-center">
              <PlusCircle className="me-1" size={16} /> Novo Evento
            </Button>
          </div>
          {eventosDoDia.length === 0 ? (
            <p className="text-muted mb-0">Nenhum evento neste dia.</p>
          ) : (
            <div className="proximos-eventos-list">
              {eventosDoDia.map(ev => (
                <div
                  key={ev.id}
                  className="proximo-evento-card"
                  style={{ borderLeftColor: ev.cor }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Ver detalhes do evento ${ev.titulo}`}
                  onClick={() => { setShowDiaModal(false); abrirVisualizarEvento(ev); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setShowDiaModal(false);
                      abrirVisualizarEvento(ev);
                    }
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="evento-infos">
                      <div className="evento-titulo fw-semibold mb-2">{ev.titulo}</div>
                      <div className="evento-meta"><Calendar3 className="me-2" size={16} />{formatDateBR(ev.dataInicio)}</div>
                      <div className="evento-meta"><Clock className="me-2" size={16} />{ev.horaInicio ? (ev.horaFim ? `${ev.horaInicio} - ${ev.horaFim}` : ev.horaInicio) : '—'}</div>
                      <div className="evento-meta"><GeoAlt className="me-2" size={16} />{ev.local || '—'}</div>
                    </div>
                    <div className="botoes-acao" onClick={(e) => e.stopPropagation()}>
                      <ActionIconButton
                        variant="outline-primary"
                        size="sm"
                        title="Editar"
                        ariaLabel={`Editar ${ev.titulo}`}
                        onClick={(e) => { e.stopPropagation(); setShowDiaModal(false); abrirEditar(ev); }}
                      >
                        <Pencil />
                      </ActionIconButton>
                      <ActionIconButton
                        variant="outline-danger"
                        size="sm"
                        title="Excluir"
                        ariaLabel={`Excluir ${ev.titulo}`}
                        onClick={(e) => { e.stopPropagation(); abrirConfirmarExclusao(ev); }}
                        className="ms-2"
                      >
                        <Trash />
                      </ActionIconButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowDiaModal(false)}>Fechar</Button>
        </Modal.Footer>
      </Modal>






      {/* Tabela de todos os eventos — abaixo do calendário e próximos eventos */}
      <Row className="g-2">
        <Col xs={12}>
          <Card className="mt-2">
            <Card.Header className="d-flex align-items-center justify-content-between">
              <h5 className="mb-0">Todos os Eventos</h5>
            </Card.Header>
            <Card.Body>
              {eventosFiltradosOrdenados.length === 0 ? (
                <Alert variant="warning" className="mb-0">Nenhum evento encontrado com os filtros atuais.</Alert>
              ) : (
                <StandardTable className="align-middle">
                  <thead>
                    <tr>
                      <th>Título</th>
                      <th>Data</th>
                      <th>Horário</th>
                      <th>Local</th>
                      <th>Tipo</th>
                      <th className="text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventosFiltradosOrdenados.map((e) => (
                      <tr
                        key={e.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`Ver detalhes do evento ${e.titulo}`}
                        onClick={() => abrirVisualizarEvento(e)}
                        onKeyDown={(ev) => {
                          if (ev.key === 'Enter' || ev.key === ' ') {
                            ev.preventDefault();
                            abrirVisualizarEvento(e);
                          }
                        }}
                      >
                        <td>
                          <span className="d-inline-flex align-items-center gap-2">
                            <span className="d-inline-block" style={{ width: 10, height: 10, borderRadius: 2, background: e.cor }} />
                            <span>{e.titulo}</span>
                          </span>
                        </td>
                        <td>{formatDateBR(e.dataInicio)}</td>
                        <td>{formatHora(e.horaInicio, e.horaFim)}</td>
                        <td>{e.local || '—'}</td>
                        <td>
                          <Badge bg={getTipoBadgeVariant(e.tipo)}>{e.tipo || 'Geral'}</Badge>
                        </td>
                        <td className="botoes-acao text-center" onClick={(ev) => ev.stopPropagation()}>
                          <ActionIconButton
                            variant="outline-primary"
                            size="sm"
                            title="Editar"
                            ariaLabel={`Editar ${e.titulo}`}
                            onClick={(ev) => { ev.stopPropagation(); abrirEditar(e); }}
                          >
                            <Pencil />
                          </ActionIconButton>
                          <ActionIconButton
                            variant="outline-danger"
                            size="sm"
                            title="Excluir"
                            ariaLabel={`Excluir ${e.titulo}`}
                            onClick={(ev) => { ev.stopPropagation(); abrirConfirmarExclusao(e); }}
                            className="ms-2"
                          >
                            <Trash />
                          </ActionIconButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </StandardTable>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {modo === 'criar' && 'Novo Evento'}
            {modo === 'editar' && 'Editar Evento'}
            {modo === 'visualizar' && 'Detalhes do Evento'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modo === 'visualizar' && eventoSelecionado ? (
            <div>
              <h5 className="mb-3 d-flex align-items-center gap-2">
                <Badge bg="secondary">{eventoSelecionado.tipo}</Badge>
                {eventoSelecionado.titulo}
              </h5>
              <p className="mb-1"><strong>Data:</strong> {eventoSelecionado.dataInicio}{eventoSelecionado.dataFim && eventoSelecionado.dataFim !== eventoSelecionado.dataInicio ? ` até ${eventoSelecionado.dataFim}` : ''}</p>
              {(eventoSelecionado.horaInicio || eventoSelecionado.horaFim) && (
                <p className="mb-1"><strong>Horário:</strong> {eventoSelecionado.horaInicio || '--'} {eventoSelecionado.horaFim ? `- ${eventoSelecionado.horaFim}` : ''}</p>
              )}
              {eventoSelecionado.local && <p className="mb-1"><strong>Local:</strong> {eventoSelecionado.local}</p>}
              {eventoSelecionado.descricao && <p><strong>Descrição:</strong> {eventoSelecionado.descricao}</p>}
            </div>
          ) : (
            <Form>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Título</Form.Label>
                    <Form.Control
                      value={formData.titulo}
                      onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Tipo</Form.Label>
                    <Form.Select
                      value={formData.tipo}
                      onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                    >
                      <option>Geral</option>
                      <option>Social</option>
                      <option>Educativo</option>
                      <option>Saúde</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Cor</Form.Label>
                    <Form.Control
                      type="color"
                      value={formData.cor}
                      onChange={e => setFormData({ ...formData, cor: e.target.value })}
                    />
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Data Início</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.dataInicio}
                      onChange={e => setFormData({ ...formData, dataInicio: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Data Fim</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.dataFim}
                      onChange={e => setFormData({ ...formData, dataFim: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Hora Início</Form.Label>
                    <Form.Control
                      type="time"
                      value={formData.horaInicio}
                      onChange={e => setFormData({ ...formData, horaInicio: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Hora Fim</Form.Label>
                    <Form.Control
                      type="time"
                      value={formData.horaFim}
                      onChange={e => setFormData({ ...formData, horaFim: e.target.value })}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Local</Form.Label>
                    <Form.Control
                      value={formData.local}
                      onChange={e => setFormData({ ...formData, local: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Notificar</Form.Label>
                    <div className="d-flex align-items-center gap-2">
                      <Form.Check
                        type="switch"
                        id="notificar-switch"
                        checked={formData.notificar}
                        onChange={e => setFormData({ ...formData, notificar: e.target.checked })}
                        label={formData.notificar ? 'Ativo' : 'Inativo'}
                      />
                      {formData.notificar && (
                        <Form.Select
                          style={{ maxWidth: 200 }}
                          value={formData.tempoNotificacao}
                          onChange={e => setFormData({ ...formData, tempoNotificacao: Number(e.target.value) })}
                        >
                          <option value={30}>30 minutos antes</option>
                          <option value={60}>1 hora antes</option>
                          <option value={180}>3 horas antes</option>
                          <option value={1440}>1 dia antes</option>
                        </Form.Select>
                      )}
                    </div>
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Descrição</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={formData.descricao}
                      onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          {modo === 'visualizar' ? (
            <div className="d-flex w-100 justify-content-between">
              <div>
                <Button variant="outline-primary" onClick={() => abrirEditar(eventoSelecionado)}>
                  <Pencil className="me-2" /> Editar
                </Button>
              </div>
              <div className="d-flex gap-2">
                <Button variant="outline-secondary" onClick={() => setShowModal(false)}>Fechar</Button>
                <Button variant="danger" onClick={() => abrirConfirmarExclusao(eventoSelecionado)}>
                  <Trash className="me-2" /> Excluir
                </Button>
              </div>
            </div>
          ) : (
            <div className="d-flex w-100 justify-content-between">
              <Button variant="outline-secondary" onClick={limparForm}>Limpar</Button>
              <div className="d-flex gap-2">
                <Button variant="outline-secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button variant="primary" onClick={salvar}>Salvar</Button>
              </div>
            </div>
          )}
        </Modal.Footer>
      </Modal>

      {/* Modal de confirmação de exclusão — padrão e linguagem consistentes */}
      <Modal
        show={showConfirmDelete}
        onHide={() => setShowConfirmDelete(false)}
        aria-labelledby="modalConfirmarExclusaoEvento"
        aria-describedby="modalConfirmarExclusaoEventoDescricao"
      >
        <Modal.Header closeButton>
          <Modal.Title id="modalConfirmarExclusaoEvento">Confirmar Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p id="modalConfirmarExclusaoEventoDescricao">
            Tem certeza que deseja excluir este evento? Esta ação não poderá ser desfeita.
          </p>
          {eventoParaExcluir?.titulo && (
            <p className="fw-bold">{eventoParaExcluir.titulo}</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmDelete(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmarExclusaoEvento}>
            Excluir
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
    </Navbar>
  );
}