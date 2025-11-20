import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button, Spinner } from 'react-bootstrap'
import logo from '../styles/Logo sem fundo.png'
import { downloadPdf } from '../utils/pdf'
import eventoService from '../services/eventoService'
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

function formatHora(hInicio, hFim) {
  const hi = hInicio || null
  const hf = hFim || null
  if (!hi && !hf) return '—'
  if (hi && hf) return `${hi} - ${hf}`
  return hi || hf || '—'
}

export default function EventoFicha() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [evento, setEvento] = useState(null)
  const containerRef = useRef(null)
  

  const pageTitle = useMemo(() => {
    const base = 'Ficha do Evento'
    if (!evento) return base
    const dt = formatDateBR(evento?.dataInicio)
    return `${base} — ${evento?.titulo ?? '—'} (${dt})`
  }, [evento])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const ev = await eventoService.getById(id)
      setEvento(ev || null)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Erro ao carregar evento')
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
    <div className="ficha-root" aria-label="Página de Ficha Completa do Evento">
      <div className="ficha-container" ref={containerRef}>
        <div className="no-print controls-row mb-3 d-flex justify-content-between align-items-center">
          <div>
            <Link to="/eventos" className="btn btn-outline-secondary">Voltar</Link>
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
          {error && <div className="alert alert-danger">{error}</div>}
          {loading && <div className="text-center py-3"><Spinner animation="border" /></div>}
          {!loading && evento && (
            <>
              <section className="ficha-section" aria-labelledby="sec-dados-evento">
                <h3 id="sec-dados-evento">Dados do Evento</h3>
                <table className="ficha-table">
                  <tbody>
                    <tr><th>Título</th><td>{evento?.titulo ?? '—'}</td></tr>
                    <tr><th>Tipo</th><td>{evento?.tipo ?? '—'}</td></tr>
                    <tr><th>Data Início</th><td>{formatDateBR(evento?.dataInicio)}</td></tr>
                    <tr><th>Data Fim</th><td>{formatDateBR(evento?.dataFim)}</td></tr>
                    <tr><th>Horário</th><td>{formatHora(evento?.horaInicio, evento?.horaFim)}</td></tr>
                    <tr><th>Local</th><td>{evento?.local ?? '—'}</td></tr>
                  </tbody>
                </table>
              </section>

              <section className="ficha-section" aria-labelledby="sec-descricao">
                <h3 id="sec-descricao">Descrição</h3>
                <div>{evento?.descricao ?? '—'}</div>
              </section>
            </>
          )}
        </main>
        
      </div>
    </div>
  )
}