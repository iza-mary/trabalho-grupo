import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { criarProduto } from '../services/produtosService';
import ProdutoForm from '../components/produtos/ProdutoForm';
import { Button } from 'react-bootstrap';
import { FileEarmarkText } from 'react-bootstrap-icons';
import PageHeader from '../components/ui/PageHeader';

export default function ProdutoNovo() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const initialValues = {
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

  return (
    <main className="container-fluid" style={{ marginTop: 20 }}>
      {/* Cabeçalho padronizado com PageHeader (mb-4 page-header row) */}
      <PageHeader
        title="Cadastrar Novo Item no Estoque"
        icon={<FileEarmarkText />}
        actions={(
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/produtos')}>Estoque</button>
        )}
      />

      {error && <div role="alert" className="alert alert-danger">{error}</div>}
      {success && <div role="status" className="alert alert-success">{success}</div>}

      <div className="card">
        <div className="card-body">
          <ProdutoForm
            initialValues={initialValues}
            submitLabel="Salvar Cadastro"
            hideActions
            formId="produto-form"
            onCancel={() => navigate('/produtos')}
            onSubmit={async (payload) => {
              setError('');
              setSuccess('');
              const res = await criarProduto(payload);
              if (res?.success) {
                setSuccess('Produto criado com sucesso');
                navigate('/produtos', { replace: true, state: { success: 'Produto criado com sucesso' } });
              } else {
                setError(res?.error || 'Falha ao criar produto');
              }
            }}
          />
        </div>
      </div>

      <div className="form-actions d-flex justify-content-end gap-2 mt-3">
        <Button variant="secondary" type="button" onClick={() => navigate('/produtos')}>Cancelar</Button>
        <Button variant="primary" type="submit" form="produto-form">Salvar Cadastro</Button>
      </div>
    </main>
  );
}