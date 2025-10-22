import { Button } from "react-bootstrap";
import { PlusCircle, HeartFill } from "react-bootstrap-icons";
import "./SataDoadores.css";
import PageHeader from '../ui/PageHeader';
import { useAuth } from '../../hooks/useAuth';

function HeaderTabela({ desativaTabela }) {
  const { isAdmin } = useAuth();
  return (
    <PageHeader
      title="Lista de Doadores"
      icon={<HeartFill />}
      actions={
        <Button
          variant="primary"
          onClick={() => { if (isAdmin) desativaTabela(false); }}
          className={`d-inline-flex align-items-center ${!isAdmin ? 'disabled-action' : ''}`}
          disabled={!isAdmin}
          title={!isAdmin ? 'Apenas Administradores podem cadastrar doadores' : 'Novo Doador'}
        >
          <PlusCircle className="me-1" size={16} /> Novo Doador
        </Button>
      }
    />
  );
}

export default HeaderTabela;