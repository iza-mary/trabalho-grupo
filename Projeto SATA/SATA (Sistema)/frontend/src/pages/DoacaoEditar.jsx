import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Button, Spinner, Modal } from 'react-bootstrap'
import FormEditarDin from '../components/ComponetesDoacoes/FormEditarDinComp/FormEditarDin'
import FormEditarAlim from '../components/ComponetesDoacoes/FormEditarAlimComp/FormEditarAlim'
import FormEditarOutros from '../components/ComponetesDoacoes/FormEditarOutrosComp/FormEditarOutros'
import doacoesService from '../services/doacaoService'

export default function DoacaoEditar() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [doacao, setDoacao] = useState(null)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        const dados = await doacoesService.getById(Number(id))
        if (mounted) setDoacao(dados)
      } catch {
        setError('Erro ao carregar doação para edição')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [id])

  const tipoEdit = useMemo(() => String(doacao?.tipo || '').toUpperCase(), [doacao])

  const handleEdit = async (dadosAtualizados) => {
    const doadorIdNorm = dadosAtualizados?.doador?.doadorId ?? dadosAtualizados?.doador?.id ?? dadosAtualizados?.doador
    const doadorIdNum = Number(doadorIdNorm)
    if (!Number.isFinite(doadorIdNum) || doadorIdNum <= 0) {
      alert('Selecione um doador válido antes de salvar.')
      return
    }
    const idosoNomeNorm = (
      dadosAtualizados?.idoso?.nome ??
      dadosAtualizados?.idoso ??
      dadosAtualizados?.destinatario ??
      ''
    )
    const idosoIdNorm = dadosAtualizados?.idoso?.id ?? dadosAtualizados?.idosoId ?? null
    const tipoUp = String(dadosAtualizados?.tipo || doacao?.tipo || '').toUpperCase()
    const tipoEnum = (tipoUp === 'D' || tipoUp === 'DINHEIRO')
      ? 'Dinheiro'
      : (tipoUp === 'A' || tipoUp === 'ALIMENTO')
        ? 'Alimento'
        : 'Outros'

    const payload = {
      id: Number(doacao?.id),
      data: (dadosAtualizados?.data ?? '').toString().slice(0, 10),
      tipo: tipoEnum,
      idoso: idosoNomeNorm,
      idosoId: idosoIdNorm,
      evento: dadosAtualizados?.evento ?? '',
      eventoId: dadosAtualizados?.eventoId ?? null,
      obs: dadosAtualizados?.obs ?? '',
      doador: {
        doadorId: doadorIdNum,
        nome: dadosAtualizados?.doador?.nome ?? ''
      },
      doacao:
        (tipoUp === 'D' || tipoUp === 'DINHEIRO')
          ? {
              valor: Number(dadosAtualizados?.doacao?.valor ?? dadosAtualizados?.valor ?? 0),
              forma_pagamento: dadosAtualizados?.doacao?.forma_pagamento ?? dadosAtualizados?.forma_pagamento ?? 'Dinheiro',
              comprovante: dadosAtualizados?.doacao?.comprovante ?? dadosAtualizados?.comprovante ?? null
            }
          : (() => {
              const item = dadosAtualizados?.doacao?.item ?? dadosAtualizados?.item ?? ''
              const qtd = Number(dadosAtualizados?.doacao?.qntd ?? dadosAtualizados?.qntd ?? 0)
              const base = {
                item,
                qntd: qtd,
                quantidade: qtd,
                unidade_medida: dadosAtualizados?.doacao?.unidade_medida ?? dadosAtualizados?.unidade_medida ?? 'Unidade(s)',
                produto_id: dadosAtualizados?.doacao?.produto_id ?? null
              }
              if (tipoUp === 'A' || tipoUp === 'ALIMENTO') {
                return { ...base, tipo_alimento: item, validade: dadosAtualizados?.doacao?.validade ?? null }
              }
              return { ...base, descricao_item: item, estado_conservacao: dadosAtualizados?.doacao?.estado_conservacao ?? 'Bom' }
            })()
    }
    try {
      await doacoesService.update(payload)
      navigate('/doacoes', { state: { showTable: true } })
    } catch (e) {
      alert(e?.response?.data?.message || 'Erro ao atualizar doação')
    }
  }

  return (
    <>
      {location.state?.background ? (
        <Modal show onHide={() => navigate('/doacoes', { state: { showTable: true } })} dialogClassName="modal-90w" backdrop="static">
          <Modal.Header closeButton>
            <Modal.Title>Editar Doação</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {loading ? (
              <div className="text-center py-5"><Spinner /></div>
            ) : error ? (
              <div className="alert alert-danger" role="alert">{error}</div>
            ) : tipoEdit === 'D' || tipoEdit === 'DINHEIRO' ? (
              <FormEditarDin
                show={() => navigate('/doacoes', { state: { showTable: true } })}
                doacaoEdit={doacao}
                onEdit={handleEdit}
              />
            ) : tipoEdit === 'A' || tipoEdit === 'ALIMENTO' ? (
              <FormEditarAlim
                show={() => navigate('/doacoes', { state: { showTable: true } })}
                doacaoEdit={doacao}
                onEdit={handleEdit}
              />
            ) : (
              <FormEditarOutros
                show={() => navigate('/doacoes', { state: { showTable: true } })}
                doacaoEdit={doacao}
                onEdit={handleEdit}
              />
            )}
          </Modal.Body>
        </Modal>
      ) : (
        <Navbar>
          <div className="content-area main-content">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h4 className="mb-0">Editar Doação</h4>
              <Link to="/doacoes" state={{ showTable: true }} className="btn btn-outline-secondary">Voltar</Link>
            </div>
            {loading ? (
              <div className="text-center py-5"><Spinner /></div>
            ) : error ? (
              <div className="alert alert-danger" role="alert">{error}</div>
            ) : tipoEdit === 'D' || tipoEdit === 'DINHEIRO' ? (
              <FormEditarDin
                show={() => navigate('/doacoes', { state: { showTable: true } })}
                doacaoEdit={doacao}
                onEdit={handleEdit}
              />
            ) : tipoEdit === 'A' || tipoEdit === 'ALIMENTO' ? (
              <FormEditarAlim
                show={() => navigate('/doacoes', { state: { showTable: true } })}
                doacaoEdit={doacao}
                onEdit={handleEdit}
              />
            ) : (
              <FormEditarOutros
                show={() => navigate('/doacoes', { state: { showTable: true } })}
                doacaoEdit={doacao}
                onEdit={handleEdit}
              />
            )}
          </div>
        </Navbar>
      )}
    </>
  )
}
