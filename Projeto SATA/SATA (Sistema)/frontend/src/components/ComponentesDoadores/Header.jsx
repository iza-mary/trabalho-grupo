import { Button } from "react-bootstrap";
import { List, HeartFill } from "react-bootstrap-icons";
import "./SataDoadores.css";
import PageHeader from '../ui/PageHeader';

function Header({ ativaTabela }) {
  return (
    <PageHeader
      title="Cadastro de Doador"
      icon={<HeartFill />}
      actions={
        <Button
          variant="outline-secondary"
          onClick={() => ativaTabela(true)}
          className="d-inline-flex align-items-center"
        >
          <List className="me-1" size={16} /> Ver Lista
        </Button>
      }
      className="linha-cabecalho"
    />
  );
}

export default Header;