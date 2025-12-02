import { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import eventosService from "../../../services/eventosService";

// Componente de busca dinâmica inspirado no SearchSelect
// Mantém estrutura/lógica e adapta para eventos (campo opcional)
function SelectEvento({ setEvento, setEventoId, setErrors, setValidated, errors, selectedEventoEdit = "", errorKey = "evento" }) {
  const [listaEventos, setListaEventos] = useState([]);

  const fetchEventos = async (titulo) => {
    const eventos = await eventosService.searchByTitulo(titulo || "");
    if (Array.isArray(eventos)) {
      setListaEventos(eventos);
      // Evento é opcional: não marcar erro quando vazio
      if ((titulo || "").length > 0 && eventos.length === 0) {
        setErrors?.((prev) => ({ ...prev, [errorKey]: "Nenhum evento encontrado" }));
      } else {
        setErrors?.((prev) => ({ ...prev, [errorKey]: "" }));
      }
    } else {
      setListaEventos([]);
    }
  };

  useEffect(() => {
    // Prefill em edição
    const input = document.getElementsByName("evento")[0];
    if (input) input.value = selectedEventoEdit || "";
  }, [selectedEventoEdit]);

  const handleChangeBusca = (event) => {
    const value = event.target.value || "";
    if (value.length > 0) {
      document.getElementById("eventoSelect")?.classList.add("show");
      fetchEventos(value);
    } else {
      document.getElementById("eventoSelect")?.classList.remove("show");
      setEvento?.("");
      setEventoId?.(null);
      setListaEventos([]);
      // Campo opcional: limpar erro
      setErrors?.((prev) => ({ ...prev, [errorKey]: "" }));
    }
  };

  const handleSelectEvento = (evento) => {
    const input = document.getElementsByName("evento")[0];
    if (input) input.value = evento.titulo || evento.title || "";
    document.getElementById("eventoSelect")?.classList.remove("show");
    setErrors?.((prev) => ({ ...prev, [errorKey]: "" }));
    setValidated?.(true);
    setEvento?.(evento.titulo || evento.title || "");
    setEventoId?.(evento.id ?? null);
  };

  return (
    <Form.Group>
      <Form.Label>Evento</Form.Label>
      <Form.Control
        isInvalid={!!errors?.[errorKey]}
        onChange={handleChangeBusca}
        name="evento"
        placeholder="Buscar..."
      />
      <div id="eventoSelect" className="dropdown-menu position-absolute w-100 mt-1" style={{ maxHeight: '200px', overflowY: 'auto', zIndex: 1000 }}>
        {listaEventos.map((evento) => (
          <button key={evento.id} className="dropdown-item" type="button" onClick={() => handleSelectEvento(evento)}>
            {evento.titulo || evento.title || `Evento #${evento.id}`}
          </button>
        ))}
      </div>
      <Form.Control.Feedback type="invalid">
        {errors?.[errorKey]}
      </Form.Control.Feedback>
    </Form.Group>
  );
}

export default SelectEvento;
