import './App.css'
import SideBar from './Components/SideBarComp/SideBar'
import TipoDoacao from './Components/TipoDoacaoComp/TipoDoacao'
import FormDinheiro from './Components/FormDinheiroComp/FormDinheiro'
import FormAlimentos from './Components/FormAlimentosComp/FormAlimentos'
import FormOutros from './Components/FormOutrosComp/FormOutros'
import Header from './Components/HeaderComp/Header'
import HeaderTabela from './Components/HeaderTabelaComp/HeaderTabela'
import FiltroBusca from './Components/FiltroBuscaComp/FiltroBusca'
import { useEffect, useState } from 'react';
import TabelaDoacoes from './Components/TabelaDoacoesComp/TabelaDoacoes'
import { BrowserRouter } from 'react-router-dom'
import doacoesService from './services/doacaoService'
import FormEditarDin from './Components/FormEditarDinComp/FormEditarDin'
import FormEditarAlim from './Components/FormEditarAlimComp/FormEditarAlim'
import FormEditarOutros from './Components/FormEditarOutrosComp/FormEditarOutros'
function App() {
  const [tipoDoacao, setTipoDoacao] = useState('money');
  const [mostraTabela, setMostraTabela] = useState(false);
  const [doacaoToEdit, setDoacaoToEdit] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [filtros, setFiltros] = useState({
    tipo: "todos",
    data: "todos",
    destinatario : "todos",
    busca : ""
  })
  const [doacoes, setDoacoes] = useState([])

  const handleChangeEditando = (editando) => {
    if (editando === false) {
      setModoEdicao(true);
      setMostrarModal(true);
    } else {
      setModoEdicao(false);
      setMostrarModal(false);
    }
  }


  const handleSaveDoacao = async (doacao) => {
    await doacoesService.add(doacao)
  }

  const handleEditDoacao = (doacao) => {
    setDoacaoToEdit({
      id: doacao.id,
      data: doacao.data,
      tipo: doacao.tipo,
      evento: doacao.evento || "",
      obs: doacao.obs || "",
      doador: {
        doadorId: doacao.doador.doadorId,
        nome: doacao.doador.nome
      },
      doacao: doacao.tipo === "D" ? {
        valor: parseFloat(doacao.doacao.valor)
      } : {
        qntd: doacao.doacao.qntd,
        item: doacao.doacao.item
      }
    })
    setMostrarModal(true)
  } 

  const editDoacao = async (doacao) => {
    console.log(doacao)
    await doacoesService.update(doacao);
    setDoacoes(doacoes.map(d => d.id === doacao.id ? {
      id: doacao.id,
      data: doacao.data + "T03:00:00.000Z",
      tipo: doacao.tipo,
      doador: {
        doadorId: doacao.doador.doadorId,
        nome: doacao.doador.nome
      },
      evento: doacao.evento,
      obs: doacao.obs,
      doacao: {
        qntd: doacao.doacao.qntd,
        item: doacao.doacao.item,
        valor: doacao.doacao.valor
      }
    } : d))
  }

  const handleDeleteDoacao = async (doacao) => {
    await doacoesService.remove(parseInt(doacao.id));
    await loadDoacoes();
    alert("Doação excluída com sucesso!")
  }

  const handleFiltrarTipo = (tipo) => {
    setFiltros(prev => ({...prev, tipo: tipo ?? prev.tipo}));
  }

  const handleFiltrarPeriodo = (data) => {
    setFiltros(prev => ({...prev, data: data ?? prev.data}));
  }

  const handleFiltrarDestin = (destinatario) => {
    setFiltros(prev => ({...prev, destinatario: destinatario ?? prev.destinatario}));
  };

  const handleFiltrarBusca = (busca) => {
    setFiltros(prev => ({...prev, busca: busca?.toLowerCase() ?? prev.busca}))
  }

  return (
    <BrowserRouter>
      <SideBar/>
      <div className='main-content'>
        {/* Página de Cadastro de Doações */}
        {['money', 'food', 'others'].includes(tipoDoacao) && !mostraTabela && modoEdicao === false && (
          <>
            <Header ativarTabela={setMostraTabela} />
            <TipoDoacao selectTipoDoacao={setTipoDoacao} />
            {tipoDoacao === 'money' && <FormDinheiro onSave={handleSaveDoacao} />}
            {tipoDoacao === 'food' && <FormAlimentos onSave={handleSaveDoacao} />}
            {tipoDoacao === 'others' && <FormOutros onSave={handleSaveDoacao} />}
          </>
        )}
        {/* Página de Tabela de Doações */}
        {mostraTabela && (
          <>
            <HeaderTabela selectTableDoa={setMostraTabela} selectTipo={setTipoDoacao} />
            <FiltroBusca onTipo={handleFiltrarTipo} onPeriodo={handleFiltrarPeriodo} onDestinatario={handleFiltrarDestin} onBusca={handleFiltrarBusca}/>
            <TabelaDoacoes onDelete={handleDeleteDoacao} 
            onEdit={handleEditDoacao}
            doacao={doacaoToEdit}
            editando={handleChangeEditando}
            setDoacoesApp={setDoacoes}
            doacoesApp={doacoes}
            />
          </>
        )}
        {mostrarModal && doacaoToEdit.tipo ==="D" && <FormEditarDin onEdit={editDoacao} show={handleChangeEditando} doacaoEdit={doacaoToEdit}></FormEditarDin>}
        {mostrarModal && doacaoToEdit.tipo === "A" && <FormEditarAlim onEdit={editDoacao} show={handleChangeEditando} doacaoEdit={doacaoToEdit}></FormEditarAlim>}
        {mostrarModal && doacaoToEdit.tipo ==="O" && <FormEditarOutros onEdit={editDoacao} show={handleChangeEditando} doacao={doacaoToEdit}></FormEditarOutros>}
      </div>
    </BrowserRouter>
  )
}

export default App