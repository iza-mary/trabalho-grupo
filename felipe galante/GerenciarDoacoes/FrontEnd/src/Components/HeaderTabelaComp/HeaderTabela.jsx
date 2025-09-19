import { Button } from "react-bootstrap";
import { BiPlusCircle } from "react-icons/bi";

function HeaderTabela ( {selectTableDoa, selectTipo} ) {
    
    const handleTipoDoacao = (tipo) => {
        selectTableDoa(tipo);
        selectTipo("money")
    }

    return (
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Lista de Doações Recebidas</h2>
            <div>
                <Button onClick={() => {handleTipoDoacao(false)}} variant="primary">
                    <BiPlusCircle className="me-1" size={20} />
                    Nova Doação
                </Button>
            </div>
        </div>
    );
}

export default HeaderTabela;