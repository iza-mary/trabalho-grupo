import { useState } from "react";
import { Form } from "react-bootstrap";
import doacoesService from "../../../services/doacaoService";


function SelectDoador({ setDoador, setErrors, setValidated, errors } ) {

    const [listadoadores, setListaDoadores] = useState([])

    const fetchDoadores = async (nome) => {
        const doadores = await doacoesService.getDoadorByName(nome)
        if (doadores.length === 0) {
            setErrors((prev) => ({ ...prev, doador: "Nenhum doador encontrado" }));
            setValidated(false);
            document.getElementById("doadorSelect").classList.remove("show");
        } else {
            setErrors((prev) => ({ ...prev, doador: "" }));
        }
        setListaDoadores(doadores)
    }

    const handleChangeBusca = (event) => {
        const value = event.target.value;
        if (value.length > 0) {
            document.getElementById("doadorSelect").classList.add("show");
            fetchDoadores(value);
        } else {
            document.getElementById("doadorSelect").classList.remove("show");
            setDoador(prev => ({
                ...prev,
                doador: {
                    doadorId: 0,
                    nome: ""
                }
            }));
            setListaDoadores([]);
            setErrors((prev) => ({ ...prev, doador: "Doador é obrigatório" }));
            setValidated(false);
        }
    }


    const handleSelectDoador = (doador) => {
        document.getElementsByName("doador")[0].value = doador.nome;
        document.getElementById("doadorSelect").classList.remove("show");
        setDoador(
            {
                doadorId: doador.id,
                nome: doador.nome
            }
        );
    }


    return (
        <Form.Group>
            <Form.Label>Doador</Form.Label>
            <Form.Control isInvalid={!!errors.doador} onChange={(e) => { handleChangeBusca(e) }} name="doador" placeholder="Pesquise um Doador" autoComplete="off" />
            <div id="doadorSelect" className="dropdown-menu position-absolute w-100 mt-1" style={{maxHeight : '200px', overflowY:'auto', zIndex: 1000}}>
                {listadoadores.map((doador) => (
                    <button key={doador.id} className="dropdown-item" type="button" onClick={() => {
                        handleSelectDoador(doador);
                    }} >{doador.nome}</button>
                ))}
            </div>
            <Form.Control.Feedback type="invalid">
                {errors.doador}
            </Form.Control.Feedback>
        </Form.Group>
    );
}

export default SelectDoador;