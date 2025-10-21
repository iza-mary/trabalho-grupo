import { Button } from "react-bootstrap";
import { BiPlusCircle } from "react-icons/bi";
import { GiftFill } from "react-bootstrap-icons";
import PageHeader from '../../ui/PageHeader';

function HeaderTabela ( {selectTableDoa, selectTipo} ) {
    
    const handleTipoDoacao = (tipo) => {
        selectTableDoa(tipo);
        selectTipo("money")
    }

    return (
        <PageHeader
            title="Lista de Doações Recebidas"
            icon={<GiftFill />}
            actions={
                <Button onClick={() => {handleTipoDoacao(false)}} variant="primary">
                    <BiPlusCircle className="me-1" size={20} />
                    Nova Doação
                </Button>
            }
        />
    );
}

export default HeaderTabela;
