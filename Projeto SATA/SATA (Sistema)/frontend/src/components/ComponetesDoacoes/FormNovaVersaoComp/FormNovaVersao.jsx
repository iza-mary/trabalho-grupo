import { useEffect, useMemo, useState } from 'react'
import TipoDoacao from '../TipoDoacaoComp/TipoDoacao'
import FormDinheiro from '../FormDinheiroComp/FormDinheiro'
import FormAlimentos from '../FormAlimentosComp/FormAlimentos'
import FormOutros from '../FormOutrosComp/FormOutros'
import FormEditarDin from '../FormEditarDinComp/FormEditarDin'
import FormEditarAlim from '../FormEditarAlimComp/FormEditarAlim'
import FormEditarOutros from '../FormEditarOutrosComp/FormEditarOutros'

export default function FormNovaVersao({ onSave, onEdit, onCancel, defaultTipo = 'money', mode = 'create', initialData = null }) {
  const [tipo, setTipo] = useState(defaultTipo)

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      const t = String(initialData?.tipo || '').toUpperCase()
      const mapped = t === 'D' || t === 'DINHEIRO' ? 'money' : (t === 'A' || t === 'ALIMENTO') ? 'food' : 'others'
      setTipo(mapped)
    }
  }, [mode, initialData])

  const isEdit = mode === 'edit'

  const body = useMemo(() => {
    if (!isEdit) {
      if (tipo === 'money') return <FormDinheiro onSave={onSave} />
      if (tipo === 'food') return <FormAlimentos onSave={onSave} />
      return <FormOutros onSave={onSave} />
    }
    const data = initialData || {}
    const tipoUp = String(data?.tipo || '').toUpperCase()
    if (tipoUp === 'D' || tipoUp === 'DINHEIRO') {
      return <FormEditarDin onEdit={onEdit} show={onCancel} doacaoEdit={data} />
    }
    if (tipoUp === 'A' || tipoUp === 'ALIMENTO') {
      return <FormEditarAlim onEdit={onEdit} show={onCancel} doacaoEdit={data} />
    }
    return <FormEditarOutros onEdit={onEdit} show={onCancel} doacaoEdit={data} />
  }, [isEdit, tipo, onSave, onEdit, onCancel, initialData])

  return (
    <>
      {isEdit ? (
        body
      ) : (
        <>
          <TipoDoacao selectTipoDoacao={setTipo} />
          {body}
        </>
      )}
    </>
  )
}
