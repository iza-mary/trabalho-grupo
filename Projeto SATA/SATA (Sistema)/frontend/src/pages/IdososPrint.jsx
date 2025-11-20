import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Spinner } from 'react-bootstrap'
import logo from '../styles/Logo sem fundo.png'
import { downloadPdf } from '../utils/pdf'
import { Link, useLocation } from 'react-router-dom'
import idosoService from '../services/idosoService'
import { removeManualPageBreaks, applySpacingNormalization, removeSpacingNormalization } from '../utils/printSanitizer'
import '../styles/ficha.css'
import '../styles/print.css'

function formatDateBR(v) {
  if (!v) return '—'
  try {
    const d = typeof v === 'string' ? new Date(v) : v
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('pt-BR')
  } catch { return '—' }
}

const IdososPrint = () => {
  const [idosos, setIdosos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const containerRef = useRef(null)
  const location = useLocation()
  const q = new URLSearchParams(location.search)
  const status = q.get('status') || ''
  const ordenacao = q.get('ordenacao') || 'nome_asc'
  const busca = q.get('busca') || ''

  const loadIdosos = async () => {
    setLoading(true)
    setError(null)
    try {
      const lista = await idosoService.getAll()
      setIdosos(Array.isArray(lista) ? lista : [])
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Erro ao carregar idosos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadIdosos() }, [])

  const filtered = useMemo(() => {
    let lista = Array.isArray(idosos) ? [...idosos] : []
    if (status) {
      if (status === 'internado') lista = lista.filter(i => i.status === 'internado')
      else if (status === 'nao_internado') lista = lista.filter(i => i.status !== 'internado')
    }
    if (busca) {
      const t = busca.toLowerCase()
      lista = lista.filter(i => {
        const base = `${i.nome || ''} ${i.cpf || ''} ${i.cidade || ''}`.toLowerCase()
        return base.includes(t)
      })
    }
    const calcularIdade = (dataNasc) => {
      if (!dataNasc) return 0
      const nasc = new Date(dataNasc)
      const hoje = new Date()
      let idade = hoje.getFullYear() - nasc.getFullYear()
      const mes = hoje.getMonth() - nasc.getMonth()
      if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) idade--
      return idade
    }
    switch (ordenacao) {
      case 'nome_asc':
        lista.sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || '')))
        break
      case 'nome_desc':
        lista.sort((a, b) => String(b.nome || '').localeCompare(String(a.nome || '')))
        break
      case 'data_asc':
        lista.sort((a, b) => new Date(a.dataEntrada || '9999-12-31') - new Date(b.dataEntrada || '9999-12-31'))
        break
      case 'data_desc':
        lista.sort((a, b) => new Date(b.dataEntrada || '0001-01-01') - new Date(a.dataEntrada || '0001-01-01'))
        break
      case 'idade_asc':
        lista.sort((a, b) => calcularIdade(a.dataNascimento) - calcularIdade(b.dataNascimento))
        break
      case 'idade_desc':
        lista.sort((a, b) => calcularIdade(b.dataNascimento) - calcularIdade(a.dataNascimento))
        break
      default:
        break
    }
    return lista
  }, [idosos, status, busca, ordenacao])

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

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => handlePrint(), 200)
      return () => clearTimeout(t)
    }
  }, [loading])

  const pageTitle = 'Lista de Idosos'
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
    <div className="container-fluid py-3 ficha-root">
      <div ref={containerRef} className="ficha-container">
        <div className="no-print controls-row mb-3 d-flex justify-content-between align-items-center">
          <div>
            <Link to="/idosos" className="btn btn-outline-secondary">Voltar</Link>
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
                    <th>Nome</th>
                    <th>Nascimento</th>
                    <th>Identificação</th>
                    <th>Contato</th>
                  </tr>
                </thead>
                <tbody>
                  {(filtered || []).map((i) => (
                    <tr key={i.id}>
                      <td>{i.nome || '—'}</td>
                      <td>{formatDateBR(i.dataNascimento)}</td>
                      <td>{i.rg ? `RG ${i.rg}` : (i.cpf ? `CPF ${i.cpf}` : '—')}</td>
                      <td>{[i.telefone, i.cidade, i.rua && `${i.rua}, ${i.numero}`].filter(Boolean).join(' · ')}</td>
                    </tr>
                  ))}
                  {(!loading && filtered?.length === 0) && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-3">Nenhum idoso encontrado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          )}
        </main>
        
      </div>
    </div>
  )
}

export default IdososPrint