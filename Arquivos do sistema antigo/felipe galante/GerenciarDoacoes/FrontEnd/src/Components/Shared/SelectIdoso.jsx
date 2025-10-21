import { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import idososService from "../../services/idososService";

// Componente de busca dinâmica inspirado no SearchSelect (base fornecida)
// Mantém a lógica e estrutura do projeto, adaptando apenas para Idoso
function SelectIdoso({ setIdoso, setErrors, setValidated, errors, selectedIdosoEdit, errorKey = "idoso" }) {
  const [listaIdosos, setListaIdosos] = useState([]);

  const fetchIdosos = async (nome) => {
    const idosos = await idososService.searchIdososByNome(nome || "");
    if (Array.isArray(idosos)) {
      setListaIdosos(idosos);
      if (idosos.length === 0 && (nome || "").length > 0) {
        setErrors?.((prev) => ({ ...prev, [errorKey]: "Nenhum idoso encontrado" }));
        setValidated?.(false);
      } else {
        setErrors?.((prev) => ({ ...prev, [errorKey]: "" }));
      }
    } else {
      setListaIdosos([]);
    }
  };

  useEffect(() => {
    // Prefill em edição
    if (selectedIdosoEdit?.nome) {
      const input = document.getElementsByName("idoso")[0];
      if (input) input.value = selectedIdosoEdit.nome;
    } else {
      const input = document.getElementsByName("idoso")[0];
      if (input) input.value = "";
    }
  }, [selectedIdosoEdit]);

  const handleChangeBusca = (event) => {
    const value = event.target.value || "";
    if (value.length > 0) {
      document.getElementById("idosoSelect")?.classList.add("show");
      fetchIdosos(value);
    } else {
      document.getElementById("idosoSelect")?.classList.remove("show");
      setIdoso?.({ id: 0, nome: "" });
      setListaIdosos([]);
      setErrors?.((prev) => ({ ...prev, [errorKey]: "Por favor, selecione um idoso" }));
      setValidated?.(false);
    }
  };

  const handleSelectIdoso = (idoso) => {
    const input = document.getElementsByName("idoso")[0];
    if (input) input.value = idoso.nome;
    document.getElementById("idosoSelect")?.classList.remove("show");
    setErrors?.((prev) => ({ ...prev, [errorKey]: "" }));
    setValidated?.(true);
    setIdoso?.({ id: idoso.id, nome: idoso.nome });
  };

  return (
    <Form.Group>
      <Form.Label>Destinatário (Idoso)</Form.Label>
      <Form.Control
        isInvalid={!!errors?.[errorKey]}
        onChange={handleChangeBusca}
        name="idoso"
        placeholder="Pesquise um Idoso"
      />
      <div id="idosoSelect" className="dropdown-menu position-absolute w-100 mt-1" style={{ maxHeight: '200px', overflowY: 'auto', zIndex: 1000 }}>
        {listaIdosos.map((idoso) => (
          <button key={idoso.id} className="dropdown-item" type="button" onClick={() => handleSelectIdoso(idoso)}>
            {idoso.nome}
          </button>
        ))}
      </div>
      <Form.Control.Feedback type="invalid">
        {errors?.[errorKey]}
      </Form.Control.Feedback>
    </Form.Group>
  );
}

export default SelectIdoso;