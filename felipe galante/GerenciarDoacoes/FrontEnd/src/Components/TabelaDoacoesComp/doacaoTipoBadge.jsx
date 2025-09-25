import { Badge } from "react-bootstrap";

function DoacaoTipoBadge({tipo}) {

    const formatType = (value) => {
        return value.charAt(0).toUpperCase() + value.slice(1)
    }

    let variant;
    const tipoUpper = tipo.toUpperCase();
    
    switch (tipoUpper) {
        case "A": variant = "warning"
            break;
        case "D": variant = "success"
        break
        case "O": variant = "secondary"
        break;
        default:
            variant = "success"
            break;
    }
    return <Badge bg={variant}>{formatType(tipo)}</Badge>
}

export default DoacaoTipoBadge