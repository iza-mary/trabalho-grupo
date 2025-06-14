import { useState, useEffect } from 'react';

export default function DespesaForm({ onSave, despesaAtual }) {
  const [form, setForm] = useState({ descricao: '', valor: '', tipo: '', data: '' });

  useEffect(() => {
    if (despesaAtual) setForm(despesaAtual);
  }, [despesaAtual]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = e => {
    e.preventDefault();
    onSave(form);
    setForm({ descricao: '', valor: '', tipo: '', data: '' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="descricao" placeholder="Descrição" value={form.descricao} onChange={handleChange} required />
      <input name="valor" type="number" placeholder="Valor" value={form.valor} onChange={handleChange} required />
      <input name="tipo" placeholder="Tipo" value={form.tipo} onChange={handleChange} required />
      <input name="data" type="date" value={form.data} onChange={handleChange} required />
      <button type="submit">Salvar</button>
    </form>
  );
}
