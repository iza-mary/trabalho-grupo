import { Button } from "react-bootstrap";
import { List } from "react-bootstrap-icons";
import "./SataDoadores.css";

function Header({ ativaTabela }) {
  return (
    <div className="linha-cabecalho">
      <div className="d-flex justify-content-between align-items-center">
        <h2 className="mb-0">Cadastro de Doador</h2>
        <Button 
          variant="outline-secondary" 
          onClick={() => ativaTabela(true)}
          className="d-flex align-items-center"
        >
          <List className="me-1" size={16} /> Ver Lista
        </Button>
      </div>
    </div>
  );
}

export default Header