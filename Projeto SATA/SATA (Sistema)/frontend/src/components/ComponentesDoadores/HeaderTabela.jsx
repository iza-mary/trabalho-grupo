import { Button } from "react-bootstrap";
import { PlusCircle, HeartFill } from "react-bootstrap-icons";
import "./SataDoadores.css";
import PageHeader from '../ui/PageHeader';

function HeaderTabela({ desativaTabela }) {
  return (
    <PageHeader
      title="Lista de Doadores"
      icon={<HeartFill />}
      actions={
        <Button
          variant="primary"
          onClick={() => desativaTabela(false)}
          className="d-inline-flex align-items-center"
        >
          <PlusCircle className="me-1" size={16} /> Novo Doador
        </Button>
      }
    />
  );
}

export default HeaderTabela;