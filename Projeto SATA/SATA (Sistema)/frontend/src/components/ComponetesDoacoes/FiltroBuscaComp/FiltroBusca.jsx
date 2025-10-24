import { Card, Button, Row, Col, Form, InputGroup } from "react-bootstrap";
import { BsFunnel } from "react-icons/bs";
import { BiSearch } from "react-icons/bi";
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './filtrobusca.css';
import SelectEvento from "../Shared/SelectEvento";

function FiltroBusca({ onTipo, onPeriodo, onDestinatario, onBusca, onEvento }) {

    return (
            <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Filtros e Busca</h5>
                    <Button variant="outline-secondary" className="btn-sm" data-bs-toggle="collapse" data-bs-target="#filtersCollapse">
                        <BsFunnel size={15} className="me-1"></BsFunnel>Filtros
                    </Button>
                </Card.Header>
                <Card.Body className="collapse show" id="filtersCollapse">
                    <Row>
                        <Col md={3} className="mb-3">
                            <Form.Label>Tipo</Form.Label>
                            <Form.Select onChange={(e) => {onTipo(e.target.value)}}>
                                <option value="todos">Todos</option>
                                <option value="dinheiro">Dinheiro</option>
                                <option value="alimento">Alimento</option>
                                <option value="outros">Outros Itens</option>
                            </Form.Select>
                        </Col>
                        <Col md={3} className="mb-3">
                            <Form.Label>Período</Form.Label>
                            <Form.Select onChange={(e) => {onPeriodo(e.target.value)}}>
                                <option value="todos">Todos</option>
                                <option value="hoje">Hoje</option>
                                <option value="semana">Esta semana</option>
                                <option value="mes">Este mês</option>
                                <option value="ano">Este ano</option>
                            </Form.Select>
                        </Col>
                        <Col md={3} className="mb-3">
                            <Form.Label>Destinatário</Form.Label>
                            <Form.Select onChange={(e) => {onDestinatario(e.target.value)}}>
                                <option value="todos">Todos</option>
                                <option value="instituicao">Instituição</option>
                                <option value="idosos">Idosos específicos</option>
                            </Form.Select>
                        </Col>
                        <Col md={3} className="mb-3">
                            <SelectEvento
                                setEventoId={(id) => onEvento?.(id)}
                            />
                        </Col>
                        <Col md={3} className="mb-3">
                            <Form.Label>Buscar</Form.Label>
                            <InputGroup>
                                <Form.Control type="text" placeholder="Doador, item ou evento..." onChange={(e) => { onBusca(e.target.value); }} />
                            </InputGroup>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
    );
}

export default FiltroBusca;