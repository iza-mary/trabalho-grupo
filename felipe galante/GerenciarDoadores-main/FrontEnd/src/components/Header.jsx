import { Button } from "react-bootstrap";
import { List } from "react-bootstrap-icons";
import "./SataDoadores.css";

function Header({ ativaTabela }) {
  return (
    <div className="linha-cabecalho">
      <div className="d-flex justify-content-between align-items-center">
        <h2>Cadastro de Doador</h2>
        <Button 
          variant="outline-secondary" 
          onClick={() => ativaTabela(true)}
        >
          <List className="me-1" /> Ver Lista
        </Button>
      </div>
    </div>
  );
}

export default Header;