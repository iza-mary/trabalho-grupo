import { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import eventosService from "../../services/eventosService";

function SelectEvento({ setEvento, setErrors, setValidated, errors }) {
  const [listaEventos, setListaEventos] = useState([]);

  useEffect(() => {
    let ativo = true;
    const fetchEventos = async () => {
      const eventos = await eventosService.getAll();
      if (!ativo) return;
      if (!Array.isArray(eventos) || eventos.length === 0) {
        setErrors?.((prev) => ({ ...prev, evento: "Nenhum evento encontrado" }));
        setValidated?.(false);
      } else {
        setErrors?.((prev) => ({ ...prev, evento: "" }));
      }
      setListaEventos(eventos);
    };
    fetchEventos();
    return () => {
      ativo = false;
    };
  }, []);

  const handleChangeSelect = (e) => {
    const value = e.target.value;
    if (!value) {
      setErrors?.((prev) => ({ ...prev, evento: "Selecione um evento ou deixe vazio" }));
      setValidated?.(false);
      setEvento("");
      return;
    }
    const eventoSel = listaEventos.find((ev) => String(ev.id) === String(value));
    if (eventoSel) {
      setErrors?.((prev) => ({ ...prev, evento: "" }));
      setValidated?.(true);
      // Persistimos o título do evento na doação, seguindo o padrão atual
      setEvento(eventoSel.titulo);
    }
  };

  return (
    <>
      <Form.Label>Evento Relacionado (Opcional)</Form.Label>
      <Form.Select
        name="evento"
        onChange={handleChangeSelect}
        isInvalid={!!errors?.evento}
        aria-label="Selecione um evento relacionado"
      >
        <option value="">Nenhum evento relacionado</option>
        {listaEventos.map((ev) => (
          <option key={ev.id} value={ev.id}>
            {ev.titulo}
          </option>
        ))}
      </Form.Select>
      <Form.Control.Feedback type="invalid">
        {errors?.evento}
      </Form.Control.Feedback>
    </>
  );
}

export default SelectEvento;