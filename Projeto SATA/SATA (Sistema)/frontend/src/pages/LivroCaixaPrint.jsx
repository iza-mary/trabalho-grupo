import React, { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import { Button, Badge, Spinner } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import financeiroService from '../services/financeiroService';
import { removeManualPageBreaks, applySpacingNormalization, removeSpacingNormalization } from '../utils/printSanitizer';
import '../styles/ficha.css';
import '../styles/print.css';
import './IdosoFicha.css';

const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0));

const LivroCaixaPrint = () => {
  const [despesas, setDespesas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const tipo = params.get('tipo') || 'todas';
  const category = params.get('category') || '';
  const search = params.get('search') || '';
  const period = params.get('period') || 'all';
  const startDate = params.get('startDate') || '';
  const endDate = params.get('endDate') || '';

  const containerRef = useRef(null);

  const loadDespesas = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await financeiroService.list();
      setDespesas(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Erro ao carregar despesas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDespesas(); }, []);

  const visibleDespesas = useMemo(() => {
    const byTipo = (d) => tipo === 'todas' || String(d.tipo) === tipo;
    const bySearch = (d) => {
      const q = String(search || '').toLowerCase();
      if (!q) return true;
      return String(d.descricao || '').toLowerCase().includes(q) || String(d.observacao || '').toLowerCase().includes(q);
    };
    const byCategory = (d) => !category || String(d.categoria) === category;

    const today = new Date();
    let start = new Date(0);
    let end = new Date('9999-12-31');
    if (period === 'last7') {
      const s = new Date(today);
      s.setDate(s.getDate() - 6);
      start = new Date(s.getFullYear(), s.getMonth(), s.getDate());
      end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    } else if (period === 'last30') {
      const s = new Date(today);
      s.setDate(s.getDate() - 29);
      start = new Date(s.getFullYear(), s.getMonth(), s.getDate());
      end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    } else if (period === 'today') {
      start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    } else if (period === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (period === 'quarter') {
      const qStartMonth = Math.floor(today.getMonth() / 3) * 3;
      start = new Date(today.getFullYear(), qStartMonth, 1);
      end = new Date(today.getFullYear(), qStartMonth + 3, 0);
    } else if (period === 'year') {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
    } else if (period === 'custom') {
      start = startDate ? new Date(startDate) : new Date(0);
      end = endDate ? new Date(endDate) : new Date('9999-12-31');
    }

    const byDate = (d) => {
      if (!d?.data) return true;
      const time = new Date(d.data).getTime();
      return time >= start.getTime() && time <= end.getTime();
    };

    return [...despesas]
      .filter((d) => byTipo(d) && bySearch(d) && byCategory(d) && byDate(d))
      .sort((a, b) => new Date(b.data) - new Date(a.data));
  }, [despesas, tipo, category, search, period, startDate, endDate]);

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
    // Auto-acionar a impressão ao entrar na página
    if (!loading) {
      const t = setTimeout(() => handlePrint(), 200);
      return () => clearTimeout(t);
    }
  }, [loading]);

  const pageTitle = 'Livro Caixa';
  const rangeLabel = (() => {
    if (period === 'custom') {
      return `${startDate || 'início'} - ${endDate || 'fim'}`;
    }
    return period;
  })();

  return (
    <Navbar disableSidebar={true}>
      <div className="container-fluid py-3 ficha-root">
        <div ref={containerRef} className="ficha-container">
          <div className="no-print controls-row mb-3 d-flex justify-content-between align-items-center">
            <div>
              <Link to="/financeiro" className="btn btn-outline-secondary">Voltar</Link>
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
                <div className="ficha-meta small text-muted">Período: {rangeLabel} · Gerado em {new Date().toLocaleDateString('pt-BR')}</div>
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
                      <th>Descrição</th>
                      <th>Tipo</th>
                      <th className="text-end">Valor</th>
                      <th>Categoria</th>
                      <th>Recorrente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(visibleDespesas || []).map((d) => (
                      <tr key={d.id}>
                        <td>{d.descricao}</td>
                        <td>
                          <Badge bg={String(d.tipo) === 'Entrada' ? 'success' : 'danger'} className="text-capitalize">{d.tipo}</Badge>
                        </td>
                        <td className="text-end">{formatCurrency(d.valor)}</td>
                        <td>{d.categoria ?? '-'}</td>
                        <td>{d.recorrente ? 'Sim' : 'Não'}</td>
                      </tr>
                    ))}
                    {(!loading && visibleDespesas?.length === 0) && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-3">Nenhuma despesa encontrada no intervalo selecionado</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </section>
            )}
          </main>
          
        </div>
      </div>
    </Navbar>
  );
};

export default LivroCaixaPrint;