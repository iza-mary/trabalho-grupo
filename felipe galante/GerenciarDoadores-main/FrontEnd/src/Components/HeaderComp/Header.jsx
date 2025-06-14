import { Button } from "react-bootstrap";
import { PiListThin } from "react-icons/pi";

function Header({ ativaTabela }) {

    const handleClick = (boolean) => {
        ativaTabela(boolean)
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Cadastrar Doador</h2>
                <Button onClick={() => {handleClick(true)}} variant="outline-secondary"> <PiListThin /> Ver Todas</Button>
            </div>
        </div>
    );
}

export default Header;