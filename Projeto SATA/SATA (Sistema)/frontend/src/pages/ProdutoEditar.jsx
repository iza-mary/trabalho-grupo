import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { obterProduto, atualizarProduto } from '../services/produtosService';
import ProdutoForm from '../components/produtos/ProdutoForm';
import PageHeader from '../components/ui/PageHeader';
import { FileEarmarkText } from 'react-bootstrap-icons';

export default function ProdutoEditar() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [initialValues, setInitialValues] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setError('');
      setSuccess('');
      setLoading(true);
      try {
        const res = await obterProduto(id);
        if (!active) return;
        if (res?.success && res?.data) {
          const p = res.data;
          setInitialValues({
            id: p.id,
            nome: p.nome || '',
            categoria: p.categoria || '',
            unidade_medida: p.unidade_medida || 'Unidade',
            estoque_atual: String(p.estoque_atual ?? 0),
            estoque_minimo: String(p.estoque_minimo ?? 0),
            preco: String(p.preco ?? ''),
            quantidade: String(p.quantidade ?? ''),
            descricao: p.descricao || '',
            observacao: p.observacao || ''
          });
        } else {
          setError(res?.error || 'Produto não encontrado');
        }
      } catch {
        setError('Erro ao carregar produto');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [id]);

  return (
    <main className="container-fluid" style={{ marginTop: 20 }}>
      {/* Cabeçalho padronizado com PageHeader (mb-4 page-header row) */}
      <PageHeader
        title="Editar Produto"
        icon={<FileEarmarkText />}
        actions={(
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/produtos')}>Estoque</button>
        )}
      />

      {error && <div role="alert" className="alert alert-danger">{error}</div>}
      {success && <div role="status" className="alert alert-success">{success}</div>}

      <div className="card">
        <div className="card-body">
          {loading && <div>Carregando...</div>}
          {!loading && initialValues && (
            <ProdutoForm
              initialValues={initialValues}
              submitLabel="Salvar alterações"
              onCancel={() => navigate('/produtos')}
              onSubmit={async (payload) => {
                setError('');
                setSuccess('');
                // Não permitir alteração de quantidade/estoque por edição; apenas via Movimentar
                const sanitized = { ...payload };
                delete sanitized.quantidade;
                delete sanitized.estoque_atual;
                const res = await atualizarProduto(id, sanitized);
                if (res?.success) {
                  setSuccess('Produto atualizado com sucesso');
                  navigate('/produtos', { replace: true, state: { success: 'Produto atualizado com sucesso' } });
                } else {
                  setError(res?.error || 'Falha ao atualizar produto');
                }
              }}
            />
          )}
          {!loading && !initialValues && !error && (
            <div className="text-muted">Produto não encontrado.</div>
          )}
        </div>
      </div>
    </main>
  );
}
