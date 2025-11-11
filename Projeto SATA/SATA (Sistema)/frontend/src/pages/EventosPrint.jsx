import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Badge, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
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
    return [...eventos]
      .sort((a, b) => {
        const ad = new Date(a.dataInicio || a.dataFim || '0001-01-01').getTime();
        const bd = new Date(b.dataInicio || b.dataFim || '0001-01-01').getTime();
        return bd - ad; // mais recentes primeiro
      });
  }, [eventos]);

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

  return (
    <div className="container-fluid py-3 ficha-root">
      <div ref={containerRef} className="ficha-container">
        <div className="no-print controls-row mb-3 d-flex justify-content-between align-items-center">
          <div>
            <Link to="/eventos" className="btn btn-outline-secondary">Voltar</Link>
          </div>
          <div>
            <Button variant="primary" onClick={handlePrint}>Imprimir</Button>
          </div>
        </div>

        <header className="ficha-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <img src="/vite.svg" alt="Logo" className="ficha-logo" />
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