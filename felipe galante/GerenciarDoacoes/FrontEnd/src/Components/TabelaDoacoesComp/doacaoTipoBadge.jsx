import { Badge } from "react-bootstrap";

function DoacaoTipoBadge({tipo}) {

    const formatType = (value) => {
        return value.charAt(0).toUpperCase() + value.slice(1)
    }

    let variant;
    const tipoLower = tipo.toLowerCase();
    
    switch (tipoLower) {
        case "alimento": variant = "warning"
            break;
        case "dinheiro": variant = "success"
        break
        case "outros": variant = "secondary"
        break;
        default:
            variant = "success"
            break;
    }
    return <Badge bg={variant}>{formatType(tipo)}</Badge>
}

export default DoacaoTipoBadge