import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button, Spinner } from 'react-bootstrap'
import logo from '../styles/Logo sem fundo.png'
import { downloadPdf } from '../utils/pdf'
import doacoesService from '../services/doacaoService'
import { removeManualPageBreaks, applySpacingNormalization, removeSpacingNormalization } from '../utils/printSanitizer'
import './IdosoFicha.css'
import '../styles/ficha.css'

function formatDateBR(v) {
  if (!v) return '—'
  try {
    const d = typeof v === 'string' ? new Date(v) : v
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('pt-BR')
  } catch { return '—' }
}

function renderDetalhe(d) {
  const tipo = String(d?.tipo || '').toUpperCase()
  if (tipo === 'D') {
    const valor = d?.doacao?.valor ?? d?.valor
    if (valor == null) return '—'
    const n = Number(valor)
    if (isNaN(n)) return String(valor)
    return `R$ ${n.toFixed(2)}`
  }
  const q = d?.doacao?.qntd ?? d?.quantidade
  const un = d?.doacao?.unidade_medida ?? d?.unidade_medida
  const item = d?.doacao?.item ?? d?.item
  if (q != null) return `${q} ${un || ''} ${item || ''}`.trim()
  return item || '—'
}

export default function DoacaoFicha() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [doacao, setDoacao] = useState(null)
  
  const containerRef = useRef(null)

  const pageTitle = useMemo(() => {
    const base = 'Ficha da Doação'
    if (!doacao) return base
    const dt = formatDateBR(doacao?.data)
    const tipo = doacao?.tipo ?? ''
    return `${base} — ${dt} (${tipo})`
  }, [doacao])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const d = await doacoesService.getById(id)
      setDoacao(d || null)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Erro ao carregar doação')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handlePrint = () => {
    const root = containerRef.current
    if (root) {
      root.classList.add('no-manual-breaks')
      removeManualPageBreaks(root)
      applySpacingNormalization(root)
    }
    setTimeout(() => {
      window.print()
      setTimeout(() => {
        if (root) {
          root.classList.remove('no-manual-breaks')
          removeSpacingNormalization(root)
        }
      }, 800)
    }, 0)
  }

  const handleDownloadPdf = async () => {
    const root = containerRef.current
    if (!root) return
    root.classList.add('no-manual-breaks')
    removeManualPageBreaks(root)
    applySpacingNormalization(root)
    try {
      await downloadPdf(root, `${pageTitle}.pdf`)
    } finally {
      root.classList.remove('no-manual-breaks')
      removeSpacingNormalization(root)
    }
  }

  return (
    <div className="ficha-root" aria-label="Página de Ficha Completa da Doação">
      <div className="ficha-container" ref={containerRef}>
        <div className="no-print controls-row mb-3 d-flex justify-content-between align-items-center">
          <div>
            <Link to="/doacoes" className="btn btn-outline-secondary">Voltar</Link>
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
        </header>

        <main className="ficha-content" role="main">
          {error && (
            <div className="alert alert-danger">{error}</div>
          )}
          {loading && (
            <div className="text-center py-3"><Spinner animation="border" /></div>
          )}
          {!loading && doacao && (
            <>
              <section className="ficha-section" aria-labelledby="sec-dados-doacao">
                <h3 id="sec-dados-doacao">Dados da Doação</h3>
                <table className="ficha-table">
                  <tbody>
                    <tr><th>Data</th><td>{formatDateBR(doacao?.data)}</td></tr>
                    <tr><th>Tipo</th><td>{doacao?.tipo ?? '—'}</td></tr>
                    <tr><th>Detalhe</th><td>{renderDetalhe(doacao)}</td></tr>
                    <tr><th>Doador</th><td>{doacao?.doador?.nome ?? doacao?.doador_nome ?? '—'}</td></tr>
                    <tr><th>Destinatário</th><td>{doacao?.idoso ?? '—'}</td></tr>
                    <tr><th>Evento</th><td>{doacao?.evento ?? doacao?.evento_titulo ?? '—'}</td></tr>
                  </tbody>
                </table>
              </section>

              <section className="ficha-section" aria-labelledby="sec-obs">
                <h3 id="sec-obs">Observações</h3>
                <div>{doacao?.obs ?? '—'}</div>
              </section>
            </>
          )}
        </main>
      </div>

            
    </div>
  )
}