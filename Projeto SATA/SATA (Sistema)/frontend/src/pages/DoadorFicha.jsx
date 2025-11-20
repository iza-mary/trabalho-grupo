import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button, Spinner } from 'react-bootstrap';
import logo from '../styles/Logo sem fundo.png';
import { downloadPdf } from '../utils/pdf';
import doadorService from '../services/doadorService';
import { removeManualPageBreaks, applySpacingNormalization, removeSpacingNormalization } from '../utils/printSanitizer';
import './IdosoFicha.css';
import '../styles/ficha.css';
import { formatarCPF, formatarCNPJ, validarCPF, validarCNPJ, formatarTelefone, formatarCEP } from './validacoes';

const formatDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString('pt-BR');
};

export default function DoadorFicha() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ficha, setFicha] = useState(null);
  
  const [removerQuebrasManuais] = useState(true);
  const [ajustarEspacamento] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const data = await doadorService.getFicha(id);
        if (!active) return;
        setFicha(data);
        setError('');
      } catch (e) {
        console.error('Erro ao carregar ficha do doador:', e);
        setError(e?.response?.data?.message || e?.message || 'Falha ao carregar ficha');
      } finally {
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  const pageTitle = useMemo(() => `Ficha do Doador #${id}`, [id]);
  const paginaAtual = 1;

  const handlePrint = () => {
    const root = containerRef.current;
    if (root) {
      if (removerQuebrasManuais) {
        root.classList.add('no-manual-breaks');
        removeManualPageBreaks(root);
      }
      if (ajustarEspacamento) {
        applySpacingNormalization(root);
      }
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

  if (!ficha) {
    return (
      <div className="ficha-root">
        <div className="alert alert-warning" role="alert">Ficha não disponível.</div>
      </div>
    );
  }

  const { dadosPessoais, historicoDoacoes, observacoes } = ficha;
  const docCPF = dadosPessoais?.documentos?.cpf || '';
  const docCNPJ = dadosPessoais?.documentos?.cnpj || '';
  const representante = dadosPessoais?.representante || '';

  const renderCPF = (cpf) => {
    const v = String(cpf || '').trim();
    if (!v) return '—';
    return validarCPF(v) ? formatarCPF(v) : 'CPF inválido';
  };
  const renderCNPJ = (cnpj) => {
    const v = String(cnpj || '').trim();
    if (!v) return '—';
    return validarCNPJ(v) ? formatarCNPJ(v) : 'CNPJ inválido';
  };

  return (
    <div className="ficha-root" aria-label="Página de Ficha Completa do Doador">
      <div className="ficha-container" ref={containerRef}>
        <div className="no-print controls-row mb-3 d-flex justify-content-between align-items-center">
          <div>
            <Link to="/doadores" className="btn btn-outline-secondary">Voltar</Link>
          </div>
          <div>
            <Button variant="primary" onClick={handlePrint}>Imprimir</Button>
            <Button variant="outline-secondary" className="ms-2" onClick={handleDownloadPdf}>Baixar PDF</Button>
          </div>
        </div>

        <header className="ficha-header" role="banner">
          <div className="d-flex align-items-center gap-2">
            <img className="ficha-logo" src={logo} alt="Logo da instituição" />
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
          {/* Dados do Doador */}
          <section className="ficha-section" aria-labelledby="sec-dados-doador">
            <h3 id="sec-dados-doador">Dados do Doador</h3>
            <table className="ficha-table">
              <tbody>
                <tr><th>Nome</th><td>{dadosPessoais?.nome ?? '—'}</td></tr>
                <tr><th>Tipo</th><td>{dadosPessoais?.tipo ?? '—'}</td></tr>
                <tr><th>Telefone</th><td>{dadosPessoais?.contatos?.telefone ? formatarTelefone(dadosPessoais.contatos.telefone) : '—'}</td></tr>
                <tr><th>E-mail</th><td>{dadosPessoais?.contatos?.email ?? '—'}</td></tr>
                <tr><th>RG</th><td>{dadosPessoais?.documentos?.rg ?? '—'}</td></tr>
                <tr><th>CPF</th><td>{renderCPF(docCPF)}</td></tr>
                <tr><th>CNPJ</th><td>{renderCNPJ(docCNPJ)}</td></tr>
                {docCNPJ ? (
                  <tr><th>Representante</th><td>{representante ? representante : '—'}</td></tr>
                ) : null}
                <tr>
                  <th>Endereço</th>
                  <td>
                    {[
                      dadosPessoais?.endereco?.rua,
                      dadosPessoais?.endereco?.numero,
                      dadosPessoais?.endereco?.complemento
                    ].filter(Boolean).join(', ') || '—'}
                    <br />
                    {[
                      dadosPessoais?.endereco?.cidade,
                      dadosPessoais?.endereco?.estado
                    ].filter(Boolean).join(' - ') || ''}
                    {dadosPessoais?.endereco?.cep ? ` — CEP ${formatarCEP(dadosPessoais.endereco.cep)}` : ''}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Histórico de Doações */}
          <section className="ficha-section" aria-labelledby="sec-doacoes">
            <h3 id="sec-doacoes">Doações Registradas</h3>
            <table className="ficha-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Item/Valor</th>
                  <th>Quantidade</th>
                  <th>Destinatário</th>
                  <th>Evento</th>
                  <th>Observações</th>
                </tr>
              </thead>
              <tbody>
                {(historicoDoacoes || []).length === 0 ? (
                  <tr><td colSpan={7} className="text-center">—</td></tr>
                ) : (
                  (historicoDoacoes || []).map((h, i) => (
                    <tr key={i}>
                      <td>{formatDate(h.data)}</td>
                      <td>{h.tipo}</td>
                      <td>{h.tipo === 'D' ? (h.valor != null ? `R$ ${Number(h.valor).toFixed(2)}` : '—') : (h.item || '—')}</td>
                      <td>{h.tipo === 'D' ? '—' : (h.quantidade != null ? `${h.quantidade} ${h.unidade || ''}` : '—')}</td>
                      <td>{h.destinatario || '—'}</td>
                      <td>{h.evento || '—'}</td>
                      <td>{h.obs ? String(h.obs) : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>

          {/* Observações */}
          <section className="ficha-section" aria-labelledby="sec-obs">
            <h3 id="sec-obs">Observações</h3>
            <div className="mt-1">
              <div><strong>Status:</strong> {observacoes?.status ?? '—'}</div>
              <div className="mt-1"><strong>Anotações:</strong></div>
              <div>{observacoes?.texto ? String(observacoes.texto) : '—'}</div>
            </div>
          </section>
        </main>
      </div>

      
    </div>
  );
}