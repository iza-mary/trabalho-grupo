import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button, Spinner } from 'react-bootstrap';
import { obterProduto, listarMovimentos } from '../services/produtosService';
import { removeManualPageBreaks, applySpacingNormalization, removeSpacingNormalization } from '../utils/printSanitizer';
import './IdosoFicha.css';
import '../styles/ficha.css';

const formatDateTime = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString('pt-BR');
};

const formatBRL = (v) => {
  const n = Number(v ?? 0);
  try {
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  } catch {
    return `R$ ${n.toFixed(2)}`;
  }
};

export default function ProdutoFicha() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [produto, setProduto] = useState(null);
  const [movimentos, setMovimentos] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const [prodRes, histRes] = await Promise.all([
          obterProduto(id),
          listarMovimentos(id, { page: 1, pageSize: 50 })
        ]);
        if (!active) return;
        const prodData = prodRes?.data || prodRes;
        const histData = histRes?.data || histRes;
        setProduto(prodData);
        setMovimentos(Array.isArray(histData?.items) ? histData.items : Array.isArray(histData) ? histData : []);
        setError('');
      } catch (e) {
        console.error('Erro ao carregar ficha do produto:', e);
        setError(e?.response?.data?.error || e?.message || 'Falha ao carregar dados do produto');
      } finally {
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  const pageTitle = useMemo(() => `Ficha do Produto #${id}`, [id]);
  const paginaAtual = 1;

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
      }, 1000);
    }, 0);
  };

  if (loading) {
    return (
      <div className="ficha-root d-flex align-items-center justify-content-center" aria-busy="true">
        <Spinner animation="border" role="status" />
        <span className="ms-2">Carregando ficha...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ficha-root">
        <div className="alert alert-danger" role="alert">{error}</div>
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="ficha-root">
        <div className="alert alert-warning" role="alert">Ficha não disponível.</div>
      </div>
    );
  }

  const p = produto?.data || produto; // compatibilidade com controladores que retornam { success, data }

  return (
    <div className="ficha-root" aria-label="Página de Ficha Completa do Produto">
      <div className="ficha-container" ref={containerRef}>
        <div className="no-print controls-row mb-3 d-flex justify-content-between align-items-center">
          <div>
            <Link to="/produtos" className="btn btn-outline-secondary">Voltar</Link>
          </div>
          <div>
            <Button variant="primary" onClick={handlePrint}>Imprimir</Button>
          </div>
        </div>

        <header className="ficha-header" role="banner">
          <div className="d-flex align-items-center gap-2">
            <img className="ficha-logo" src="/vite.svg" alt="Logo da instituição" />
            <div>
              <div className="ficha-title">SATA — Sistema de Assistência</div>
              <div className="ficha-meta">{pageTitle}</div>
            </div>
          </div>
          <div className="text-end">
            <div className="ficha-meta">Página {paginaAtual}</div>
          </div>
        </header>

        <main className="ficha-content" role="main">
          {/* Dados do Produto */}
          <section className="ficha-section" aria-labelledby="sec-dados-produto">
            <h3 id="sec-dados-produto">Dados do Produto</h3>
            <table className="ficha-table">
              <tbody>
                <tr><th>Código</th><td>{p?.id ?? '—'}</td></tr>
                <tr><th>Nome</th><td>{p?.nome ?? '—'}</td></tr>
                <tr><th>Descrição</th><td>{p?.descricao ?? '—'}</td></tr>
                <tr><th>Categoria</th><td>{p?.categoria ?? '—'}</td></tr>
                <tr><th>Unidade de medida</th><td>{p?.unidade_medida ?? '—'}</td></tr>
                <tr><th>Preço</th><td>{p?.preco != null ? formatBRL(p.preco) : '—'}</td></tr>
                <tr><th>Estoque atual</th><td>{p?.quantidade != null ? `${p.quantidade} ${p?.unidade_medida || ''}` : '—'}</td></tr>
                <tr><th>Estoque mínimo</th><td>{p?.estoque_minimo != null ? `${p.estoque_minimo} ${p?.unidade_medida || ''}` : '—'}</td></tr>
                <tr><th>Observação</th><td>{p?.observacao ?? '—'}</td></tr>
                <tr><th>Data de cadastro</th><td>{p?.data_cadastro ? formatDateTime(p.data_cadastro) : '—'}</td></tr>
                <tr><th>Última atualização</th><td>{p?.data_atualizacao ? formatDateTime(p.data_atualizacao) : '—'}</td></tr>
              </tbody>
            </table>
          </section>

          {/* Histórico de Movimentações de Estoque */}
          <section className="ficha-section" aria-labelledby="sec-hist-estoque">
            <h3 id="sec-hist-estoque">Histórico de Movimentações</h3>
            <table className="ficha-table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Tipo</th>
                  <th>Quantidade</th>
                  <th>Saldo anterior</th>
                  <th>Saldo posterior</th>
                  <th>Responsável</th>
                  <th>Motivo</th>
                  <th>Observação</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(movimentos) && movimentos.length ? (
                  movimentos.map((m) => (
                    <tr key={m.id}>
                      <td>{formatDateTime(m.data_hora)}</td>
                      <td>{String(m.tipo || '').toUpperCase()}</td>
                      <td>{m.quantidade != null ? `${m.quantidade} ${p?.unidade_medida || ''}` : '—'}</td>
                      <td>{m.saldo_anterior != null ? `${m.saldo_anterior} ${p?.unidade_medida || ''}` : '—'}</td>
                      <td>{m.saldo_posterior != null ? `${m.saldo_posterior} ${p?.unidade_medida || ''}` : '—'}</td>
                      <td>{m.responsavel_nome || '—'}</td>
                      <td>{m.motivo || '—'}</td>
                      <td>{m.observacao || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={8} className="text-center">—</td></tr>
                )}
              </tbody>
            </table>
          </section>
        </main>
      </div>
    </div>
  );
}