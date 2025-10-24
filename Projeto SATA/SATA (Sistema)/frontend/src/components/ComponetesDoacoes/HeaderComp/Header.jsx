import { Button } from "react-bootstrap";
import { PiListThin } from "react-icons/pi";
import { GiftFill } from "react-bootstrap-icons";
import PageHeader from '../../ui/PageHeader';

function Header( {ativarTabela} ) {

    const handleClick = (boolean) => {
        ativarTabela(boolean);
    };

    return (
        <PageHeader
            title="Registrar Doação"
            icon={<GiftFill />}
            actions={
                <Button onClick={() => {handleClick(true)}} variant="outline-secondary"> 
                    <PiListThin/> Ver Todas
                </Button>
            }
        />
    );
}

export default Header;