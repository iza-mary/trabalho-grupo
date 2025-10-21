import { Button } from "react-bootstrap";
import { PiListThin } from "react-icons/pi";

function Header( {ativarTabela} ) {

    const handleClick = (boolean) => {
        ativarTabela(boolean);
    };

    return (
        <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Registrar Doação</h2>
            <Button onClick={() => {handleClick(true)}} variant="outline-secondary"> <PiListThin/> Ver Todas</Button>
        </div>
        </div>
    );
}

export default Header;