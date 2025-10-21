import { Card, Col, Row } from "react-bootstrap";
import "./tipodoacao.css";
import { BsCashStack } from "react-icons/bs";
import { BsBasket, BsBoxSeam } from "react-icons/bs";

function TipoDoacao({ selectTipoDoacao }) {

    // Função para lidar com a seleção do tipo de doação
    const handleTipoDoacao = (tipo, event) => {
        // Remove a classe 'active' de todos os elementos
        document.querySelectorAll('.donation-type').forEach((el) => {
            el.classList.remove('active');
        });
        // Adiciona a classe 'active' ao elemento selecionado
        event.currentTarget.classList.add('active');
        // Chama a função de callback passando o tipo de doação selecionado
        selectTipoDoacao(tipo);
    }

    return (
        <Card className="mb-4">
            <Card.Body>
                <Card.Title className="mb-4"><h5>Tipo de Doação</h5></Card.Title>
                <Row className="text-center">
                    {/* Botões que alteram o estado do componente pai para o pai saber qual formulário renderizar */}
                    <Col md={4} className="mb-3">
                        <div className="p-3 donation-type active" onClick={(e) => handleTipoDoacao('money', e)}>
                            <BsCashStack className="botaoDinheiro" />
                            <h5 className="mt-2">Dinheiro</h5>
                        </div>
                    </Col>
                    <Col md={4} className="mb-3">
                        <div className="p-3 donation-type" onClick={(e) => handleTipoDoacao('food', e)}>
                            <BsBasket className="botaoAlimentos" />
                            <h5 className="mt-2">Alimentos</h5>
                        </div>
                    </Col>
                    <Col md={4} className="mb-3">
                        <div className="p-3 donation-type" onClick={(e) => handleTipoDoacao('others', e)}>
                            <BsBoxSeam className="botaoOutros" />
                            <h5 className="mt-2">Outros Itens</h5>
                        </div>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};

export default TipoDoacao;