import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Badge, Spinner } from 'react-bootstrap';
import logo from '../styles/Logo sem fundo.png';
import { downloadPdf } from '../utils/pdf';
import { Link, useLocation } from 'react-router-dom';
import eventoService from '../services/eventoService';
import { removeManualPageBreaks, applySpacingNormalization, removeSpacingNormalization } from '../utils/printSanitizer';
import '../styles/ficha.css';
import '../styles/print.css';

const formatDateBR = (raw) => {
  if (!raw) return '—';
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

const EventosPrint = () => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const location = useLocation();
  const q = new URLSearchParams(location.search);
  const filtroTipo = q.get('tipo') || '';
  const termoBusca = q.get('busca') || '';
  const dataInicio = q.get('dataInicio') || '';
  const dataFim = q.get('dataFim') || '';
  const ordenacao = q.get('ordenacao') || 'data_desc';

  const loadEventos = async () => {
    setLoading(true);
    setError(null);
    try {
      const lista = await eventoService.getAll();
      setEventos(Array.isArray(lista) ? lista : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEventos(); }, []);

  const visibleEventos = useMemo(() => {
    let lista = Array.isArray(eventos) ? [...eventos] : [];
    if (filtroTipo) {
      const ft = filtroTipo.toLowerCase();
      lista = lista.filter(e => (e.tipo || '').toLowerCase().includes(ft));
    }
    if (termoBusca) {
      const t = termoBusca.toLowerCase();
      lista = lista.filter(e => (e.titulo || '').toLowerCase().includes(t) || (e.descricao || '').toLowerCase().includes(t) || (e.local || '').toLowerCase().includes(t));
    }
    const parseDate = (dStr) => {
      if (!dStr) return null;
      const d = new Date(dStr);
      return isNaN(d.getTime()) ? null : d;
    };
    const di = parseDate(dataInicio);
    const df = parseDate(dataFim);
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
    switch (ordenacao) {
      case 'data_asc':
        lista.sort((a, b) => {
          const aStart = parseDate(a.dataInicio) || parseDate(a.dataFim) || new Date('9999-12-31');
          const bStart = parseDate(b.dataInicio) || parseDate(b.dataFim) || new Date('9999-12-31');
          return aStart - bStart;
        });
        break;
      case 'data_desc':
        lista.sort((a, b) => {
          const aStart = parseDate(a.dataInicio) || parseDate(a.dataFim) || new Date('0001-01-01');
          const bStart = parseDate(b.dataInicio) || parseDate(b.dataFim) || new Date('0001-01-01');
          return bStart - aStart;
        });
        break;
      case 'titulo_asc':
        lista.sort((a, b) => (a.titulo || '').localeCompare(b.titulo || ''));
        break;
      case 'titulo_desc':
        lista.sort((a, b) => (b.titulo || '').localeCompare(a.titulo || ''));
        break;
      default:
        break;
    }
    return lista;
  }, [eventos, filtroTipo, termoBusca, dataInicio, dataFim, ordenacao]);

  const handlePrint = () => {
    const root = containerRef.current;
    if (root) {
      root.classList.add('no-manual-breaks');
      removeManualPageBreaks(root);
      applySpacingNormalization(root);
    }
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        if (root) {
          root.classList.remove('no-manual-breaks');
          removeSpacingNormalization(root);
        }
      }, 800);
    }, 0);
  };

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => handlePrint(), 200);
      return () => clearTimeout(t);
    }
  }, [loading]);

  const pageTitle = 'Eventos';
  
  const handleDownloadPdf = async () => {
    const root = containerRef.current;
    if (!root) return;
    root.classList.add('no-manual-breaks');
    removeManualPageBreaks(root);
    applySpacingNormalization(root);
    try {
      await downloadPdf(root, `${pageTitle}.pdf`);
    } finally {
      root.classList.remove('no-manual-breaks');
      removeSpacingNormalization(root);
    }
  };

  return (
    <div className="container-fluid py-3 ficha-root">
      <div ref={containerRef} className="ficha-container">
        <div className="no-print controls-row mb-3 d-flex justify-content-between align-items-center">
          <div>
            <Link to="/eventos" className="btn btn-outline-secondary">Voltar</Link>
          </div>
          <div>
            <Button variant="primary" onClick={handlePrint}>Imprimir</Button>
            <Button variant="outline-secondary" className="ms-2" onClick={handleDownloadPdf}>Baixar PDF</Button>
          </div>
        </div>

        <header className="ficha-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <img src={logo} alt="Logo" className="ficha-logo" />
            <div>
              <div className="ficha-title h5 mb-0">{pageTitle}</div>
              <div className="ficha-meta small text-muted">Gerado em {new Date().toLocaleDateString('pt-BR')}</div>
              
            </div>
          </div>
        </header>

        <main className="ficha-content">
          {error && <div className="alert alert-danger">{error}</div>}
          {loading && <div className="text-center py-3"><Spinner animation="border" /></div>}
          {!loading && (
            <section className="ficha-section">
              <table className="ficha-table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Data</th>
                    <th>Horário</th>
                    <th>Local</th>
                    <th>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {(visibleEventos || []).map((e) => (
                    <tr key={e.id}>
                      <td>
                        <span className="d-inline-flex align-items-center gap-2">
                          <span className="d-inline-block" style={{ width: 10, height: 10, borderRadius: 2, background: e.cor }} />
                          <span>{e.titulo}</span>
                        </span>
                      </td>
                      <td>
                        {formatDateBR(e.dataInicio)}
                        {e.dataFim && e.dataFim !== e.dataInicio ? ` até ${formatDateBR(e.dataFim)}` : ''}
                      </td>
                      <td>{formatHora(e.horaInicio, e.horaFim)}</td>
                      <td>{e.local || '—'}</td>
                      <td>
                        <Badge bg={getTipoBadgeVariant(e.tipo)}>{e.tipo || 'Geral'}</Badge>
                      </td>
                    </tr>
                  ))}
                  {(!loading && visibleEventos?.length === 0) && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-3">Nenhum evento cadastrado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          )}
        </main>
        
      </div>
    </div>
  );
};

export default EventosPrint;