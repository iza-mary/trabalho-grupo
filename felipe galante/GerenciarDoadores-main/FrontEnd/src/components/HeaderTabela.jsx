import { Button } from "react-bootstrap";
import { PlusCircle } from "react-bootstrap-icons";
import "./SataDoadores.css";

function HeaderTabela({ desativaTabela }) {
  return (
    <div className="linha-cabecalho">
      <div className="d-flex justify-content-between align-items-center">
        <h2 className="mb-0">Lista de Doadores</h2>
        <Button 
          variant="primary"
          onClick={() => desativaTabela(false)}
          className="d-flex align-items-center"
        >
          <PlusCircle className="me-1" size={16} /> Novo Doador
        </Button>
      </div>
    </div>
  );
}

export default HeaderTabela;