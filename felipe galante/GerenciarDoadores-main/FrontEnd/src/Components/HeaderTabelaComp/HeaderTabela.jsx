import { Button } from "react-bootstrap";
import { BiPlusCircle } from "react-icons/bi";

function HeaderTabela ( { desativaTabela} ) {

    const handleClick = (boolean) => {
        desativaTabela(boolean)
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Doadores</h2>
                <Button onClick={() => {handleClick(false)}} variant="primary"> <BiPlusCircle/> Cadastrar Doador</Button>
            </div>
        </div>
    )
}

export default HeaderTabela;