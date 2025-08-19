import { useEffect, useState } from 'react';
import api from '../services/api';
import DespesaForm from '../components/DespesaForm';
import DespesaList from '../components/DespesaList';

export default function Home() {
  const [despesas, setDespesas] = useState([]);
  const [atual, setAtual] = useState(null);

  useEffect(() => {
    api.get('/').then(res => setDespesas(res.data));
  }, []);

  const salvar = async despesa => {
    if (despesa.id) {
      await api.put(`/${despesa.id}`, despesa);
    } else {
      await api.post('/', despesa);
    }
    const res = await api.get('/');
    setDespesas(res.data);
    setAtual(null);
  };

  const excluir = async id => {
    await api.delete(`/${id}`);
    const res = await api.get('/');
    setDespesas(res.data);
  };

  return (
    <div>
      <h1>Gerenciador de Despesas</h1>
      <DespesaForm onSave={salvar} despesaAtual={atual} />
      <DespesaList despesas={despesas} onEdit={setAtual} onDelete={excluir} />
    </div>
  );
}
