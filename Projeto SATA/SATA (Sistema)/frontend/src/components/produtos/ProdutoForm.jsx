import { useEffect, useState } from 'react';
import { categoriasProdutos, unidadesMedidaProdutos, validarProduto, normalizarProdutoPayload } from '../../pages/validacoesProdutos';
import { Button, Spinner } from 'react-bootstrap';
import './ProdutoForm.css';

export default function ProdutoForm({ initialValues, onSubmit, onCancel, submitLabel = 'Salvar', hideActions = false, formId }) {
  const defaults = {
    nome: '',
    categoria: '',
    unidade_medida: 'Unidade',
    estoque_atual: '0',
    estoque_minimo: '0',
    preco: '',
    quantidade: '',
    descricao: '',
    observacao: ''
  };

  const [form, setForm] = useState({ ...defaults, ...(initialValues || {}) });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm({ ...defaults, ...(initialValues || {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialValues || {})]);

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validarProduto(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = normalizarProdutoPayload(form);
    setSubmitting(true);
    try {
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form id={formId} noValidate onSubmit={handleSubmit} className="row g-3">
      <div className="col-sm-6">
        <label className="form-label" htmlFor="nome">Nome</label>
        <input
          id="nome"
          className={`form-control${errors.nome ? ' is-invalid' : ''}`}
          value={form.nome}
          onChange={e => updateForm('nome', e.target.value)}
        />
        {errors.nome && <div className="invalid-feedback d-block">{errors.nome}</div>}
      </div>

      <div className="col-sm-3">
        <label className="form-label" htmlFor="categoria">Categoria</label>
        <select
          id="categoria"
          className={`form-select${errors.categoria ? ' is-invalid' : ''}`}
          value={form.categoria}
          onChange={e => updateForm('categoria', e.target.value)}
        >
          <option value="">Selecione</option>
          {categoriasProdutos.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {errors.categoria && <div className="invalid-feedback d-block">{errors.categoria}</div>}
      </div>

      <div className="col-sm-3">
        <label className="form-label" htmlFor="unidade_medida">Unidade de Medida</label>
        <select
          id="unidade_medida"
          className={`form-select${errors.unidade_medida ? ' is-invalid' : ''}`}
          value={form.unidade_medida}
          onChange={e => updateForm('unidade_medida', e.target.value)}
        >
          {unidadesMedidaProdutos.map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        {errors.unidade_medida && <div className="invalid-feedback d-block">{errors.unidade_medida}</div>}
      </div>

      <div className="col-sm-3">
        <label className="form-label" htmlFor="estoque_minimo">Estoque Mínimo</label>
        <input
          id="estoque_minimo"
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          pattern="\\d*"
          className={`form-control text-end${errors.estoque_minimo ? ' is-invalid' : ''}`}
          value={form.estoque_minimo}
          onChange={e => updateForm('estoque_minimo', e.target.value)}
        />
        {errors.estoque_minimo && <div className="invalid-feedback d-block">{errors.estoque_minimo}</div>}
      </div>

      <div className="col-sm-3">
        <label className="form-label" htmlFor="preco">Preço</label>
        <div className="input-group">
          <span className="input-group-text">R$</span>
          <input
            id="preco"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            className={`form-control text-end${errors.preco ? ' is-invalid' : ''}`}
            value={form.preco}
            onChange={e => updateForm('preco', e.target.value)}
            placeholder="0,00"
          />
        </div>
        {errors.preco && <div className="invalid-feedback d-block">{errors.preco}</div>}
      </div>

      <div className="col-sm-3">
        <label className="form-label" htmlFor="quantidade">Quantidade</label>
        <input
          id="quantidade"
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          pattern="\\d*"
          className={`form-control text-end${errors.quantidade ? ' is-invalid' : ''}`}
          value={form.quantidade}
          onChange={e => updateForm('quantidade', e.target.value)}
        />
        {errors.quantidade && <div className="invalid-feedback d-block">{errors.quantidade}</div>}
      </div>

      <div className="col-sm-12">
        <label className="form-label" htmlFor="descricao">Descrição</label>
        <textarea
          id="descricao"
          className="form-control"
          rows={3}
          value={form.descricao}
          onChange={e => updateForm('descricao', e.target.value)}
        />
      </div>

      <div className="col-sm-12">
        <label className="form-label" htmlFor="observacao">Observação</label>
        <textarea
          id="observacao"
          className="form-control"
          rows={3}
          value={form.observacao}
          onChange={e => updateForm('observacao', e.target.value)}
        />
      </div>

      {!hideActions && (
        <div className="col-sm-12 form-actions d-flex justify-content-end gap-2 mb-4">
          {onCancel && (
            <Button variant="secondary" type="button" onClick={onCancel} disabled={submitting}>
              Cancelar
            </Button>
          )}
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Salvando...</span>
              </>
            ) : submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}