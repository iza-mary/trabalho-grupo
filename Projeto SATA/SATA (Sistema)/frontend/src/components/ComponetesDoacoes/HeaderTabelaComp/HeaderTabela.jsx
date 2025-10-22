import { Button } from "react-bootstrap";
import { BiPlusCircle } from "react-icons/bi";
import { GiftFill } from "react-bootstrap-icons";
import PageHeader from '../../ui/PageHeader';
import { useAuth } from '../../../hooks/useAuth';

function HeaderTabela ( {selectTableDoa, selectTipo} ) {
    
    const handleTipoDoacao = (tipo) => {
        selectTableDoa(tipo);
        selectTipo("money")
    }

    const { isAdmin } = useAuth();

    return (
        <PageHeader
            title="Lista de Doações Recebidas"
            icon={<GiftFill />}
            actions={
                <Button 
                    onClick={() => { if (isAdmin) handleTipoDoacao(false); }} 
                    variant="primary"
                    className={!isAdmin ? 'disabled-action' : ''}
                    disabled={!isAdmin}
                    title={!isAdmin ? 'Apenas Administradores podem cadastrar doações' : 'Nova Doação'}
                >
                    <BiPlusCircle className="me-1" size={20} />
                    Nova Doação
                </Button>
            }
        />
    );
}

export default HeaderTabela;
