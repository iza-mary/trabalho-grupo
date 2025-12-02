import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button, Spinner } from 'react-bootstrap';
import logo from '../styles/Logo sem fundo.png';
import { downloadPdf } from '../utils/pdf';
import idosoService from '../services/idosoService';
import { removeManualPageBreaks, applySpacingNormalization, removeSpacingNormalization } from '../utils/printSanitizer';
import { useAuth } from '../hooks/useAuth';
import BotaoRegistrarObservacao from '../components/idosos/BotaoRegistrarObservacao';
import ObservacaoModal from '../components/idosos/ObservacaoModal';
import './IdosoFicha.css';
import '../styles/ficha.css';

const formatDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString('pt-BR');
};

// Removido: data/hora não é mais exibida nos cabeçalhos

export default function IdosoFicha() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ficha, setFicha] = useState(null);
  const { user } = useAuth();
  const [obsLista, setObsLista] = useState([]);
  const [showObservacaoModal, setShowObservacaoModal] = useState(false);
  
  const [removerQuebrasManuais] = useState(true);
  const [ajustarEspacamento] = useState(true);
  const containerRef = useRef(null);

  const fetchFicha = useCallback(async () => {
    try {
      setLoading(true);
      const data = await idosoService.getFicha(id);
      setFicha(data);
      setError('');
    } catch (e) {
      console.error('Erro ao carregar ficha:', e);
      setError(e?.response?.data?.message || e?.message || 'Falha ao carregar ficha');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchFicha();
    (async () => {
      try {
        const lista = await idosoService.getObservacoes(id);
        setObsLista(lista);
      } catch (e) {
        console.error('Erro ao carregar observações:', e);
      }
    })();
  }, [fetchFicha, id]);

  const handleSaveObservacao = async (observacaoData) => {
    try {
      await idosoService.addObservacao(id, observacaoData);
      const lista = await idosoService.getObservacoes(id);
      setObsLista(lista);
      setShowObservacaoModal(false);
    } catch (error) {
      console.error('Erro ao salvar observação:', error);
      throw error;
    }
  };

  

  const pageTitle = useMemo(() => `Ficha do Idoso #${id}`, [id]);

  // Removido: data/hora dinâmica no cabeçalho (voltamos ao cabeçalho só na 1ª página)

  const handlePrint = () => {
    // Sanitização antes da impressão
    const root = containerRef.current;
    if (root) {
      if (removerQuebrasManuais) {
        // Adiciona uma classe de contexto para CSS global e neutraliza classes/estilos
        root.classList.add('no-manual-breaks');
        removeManualPageBreaks(root);
      }
      if (ajustarEspacamento) {
        applySpacingNormalization(root);
      }
    }
    // Print
    setTimeout(() => {
      window.print();
      // Reverter alterações após um curto intervalo
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

  const { dadosPessoais, acomodacao, medica } = ficha;
  // Indicador simples de página atual (UI); constante para evitar hook condicional.
  const paginaAtual = 1;

  return (
    <div className="ficha-root" aria-label="Página de Ficha Completa do Idoso">
      <div className="ficha-container" ref={containerRef}>
        <div className="no-print controls-row mb-3 d-flex justify-content-between align-items-center">
          <div>
            <Link to="/idosos" className="btn btn-outline-secondary">Voltar</Link>
          </div>
          <div>
            {user && <BotaoRegistrarObservacao solid label="Registrar Observação" onClick={() => setShowObservacaoModal(true)} />}
            <Button variant="primary" className="ms-2" onClick={handlePrint}>Imprimir</Button>
            <Button variant="outline-secondary" className="ms-2" onClick={handleDownloadPdf}>Baixar PDF</Button>
          </div>
          {/* Botão de visualização e controles de intervalo removidos conforme solicitado */}
        </div>

        {/* Cabeçalho no topo: acima de "Dados Pessoais" */}
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
          {/* Dados Pessoais */}
          <section className="ficha-section" aria-labelledby="sec-dados">
            <h3 id="sec-dados">Dados Pessoais</h3>
            <table className="ficha-table">
              <tbody>
                <tr><th>Nome completo</th><td>{dadosPessoais?.nome ?? '—'}</td></tr>
                <tr><th>Data de nascimento</th><td>{formatDate(dadosPessoais?.dataNascimento)}</td></tr>
                <tr><th>Idade</th><td>{dadosPessoais?.idade ?? '—'}</td></tr>
                <tr><th>Telefone</th><td>{dadosPessoais?.contatos?.telefone ?? '—'}</td></tr>
                <tr><th>E-mail</th><td>{dadosPessoais?.contatos?.email ?? '—'}</td></tr>
                <tr><th>Responsável</th><td>{dadosPessoais?.contatos?.responsavel ?? '—'}</td></tr>
                <tr><th>RG</th><td>{dadosPessoais?.documentos?.rg ?? '—'}</td></tr>
                <tr><th>CPF</th><td>{dadosPessoais?.documentos?.cpf ?? '—'}</td></tr>
                <tr><th>Cartão SUS</th><td>{dadosPessoais?.documentos?.cartaoSus ?? '—'}</td></tr>
                <tr>
                  <th>Endereço</th>
                  <td>
                    {(dadosPessoais?.endereco?.rua || '—')}{dadosPessoais?.endereco?.numero ? `, ${dadosPessoais.endereco.numero}` : ''}
                    {dadosPessoais?.endereco?.complemento ? ` — ${dadosPessoais.endereco.complemento}` : ''}
                    {dadosPessoais?.endereco?.cidade ? ` — ${dadosPessoais.endereco.cidade}` : ''}
                    {dadosPessoais?.endereco?.estado ? `/${dadosPessoais.endereco.estado}` : ''}
                    {dadosPessoais?.endereco?.cep ? ` — CEP: ${dadosPessoais.endereco.cep}` : ''}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Cabeçalho já exibido acima — não repetir */}

          {/* Acomodação */}
          <section className="ficha-section" aria-labelledby="sec-acom">
            <h3 id="sec-acom">Acomodação</h3>
            <table className="ficha-table">
              <tbody>
                <tr><th>Quarto atual</th><td>{acomodacao?.atual?.quartoNumero ?? '—'}</td></tr>
                <tr><th>Cama</th><td>{acomodacao?.atual?.cama ?? '—'}</td></tr>
                <tr><th>Data de entrada</th><td>{formatDate(acomodacao?.atual?.dataEntrada)}</td></tr>
              </tbody>
            </table>

            {/* Histórico de quartos removido para evitar duplicação com "Histórico de internações" */}
          </section>

          {/* Histórico de internações — seção própria após Acomodação */}
          <section className="ficha-section" aria-labelledby="sec-internacoes">
            <h3 id="sec-internacoes">Histórico de internações</h3>
            <table className="ficha-table mt-1">
              <thead>
                <tr>
                  <th>Nº do Quarto</th>
                  <th>Cama</th>
                  <th>Entrada</th>
                  <th>Saída</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(medica?.internacoes || []).length === 0 ? (
                  <tr><td colSpan={5} className="text-center">—</td></tr>
                ) : (
                  (medica?.internacoes || []).map((h, idx) => (
                    <tr key={idx}>
                      <td>{h?.quartoNumero ?? '—'}</td>
                      <td>{h?.cama ?? '—'}</td>
                      <td>{formatDate(h?.dataEntrada)}</td>
                      <td>{formatDate(h?.dataSaida)}</td>
                      <td>{String(h?.status || '—')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>



          <section className="ficha-section" aria-labelledby="sec-obs-hist">
            <h3 id="sec-obs-hist">Histórico de Observações</h3>
            {Array.isArray(obsLista) && obsLista.length ? (
              <table className="ficha-table mt-1">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {obsLista.map((o) => (
                    <tr key={o.id} className="obs-row">
                      <td>{new Date(o.data_registro).toLocaleString('pt-BR')}</td>
                      <td className="obs-text">{o.observacao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Nenhuma observação registrada.</p>
            )}
          </section>
        </main>

        {/* Rodapé removido conforme solicitação: excluir rodapés */}
      </div>

      <ObservacaoModal
        show={showObservacaoModal}
        onHide={() => setShowObservacaoModal(false)}
        onSave={handleSaveObservacao}
        idosoId={id}
        usuarioId={user?.id}
      />
    </div>
  );
}
