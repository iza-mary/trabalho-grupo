const InternacaoRepository = require('../repository/internacaoRepository');
const IdosoRepository = require('../repository/idosoRepository');
const QuartoRepository = require('../repository/quartoRepository');
const { getCamaNome } = require('../utils/formatters');
const db = require('../config/database');

class InternacaoController {
    // Obtém todas as internações
    async getAll(req, res) {
        try {
            const internacoes = await InternacaoRepository.findAll();
            const internacoesFormatadas = internacoes.map(i => ({
                ...i,
                cama_nome: getCamaNome(i.cama) // Adiciona campo formatado
            }));
            res.json({
                success: true,
                data: internacoesFormatadas
            });
        } catch (error) {
            console.error('Erro no getAll:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar internações',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtém internações ativas - CORRIGIDO
    async getAtivas(req, res) {
        try {
            const internacoes = await InternacaoRepository.getAtivas();
            res.json({
                success: true,
                data: internacoes
            });
        } catch (error) {
            console.error('Erro no getAtivas:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar internações ativas',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtém uma internação por ID
    async getById(req, res) {
        try {
            const { id } = req.params;
            const internacao = await InternacaoRepository.findById(id);
            
            if (!internacao) {
                return res.status(404).json({
                    success: false,
                    message: 'Internação não encontrada'
                });
            }
            
            res.json({
                success: true,
                data: internacao
            });
        } catch (error) {
            console.error('Erro no getById:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar internação',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtém internações de um idoso
    async getByUsuarioId(req, res) {
        try {
            const { id } = req.params;
            const internacoes = await InternacaoRepository.findByUsuarioId(id);
            
            res.json({
                success: true,
                data: internacoes
            });
        } catch (error) {
            console.error('Erro no getByUsuarioId:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar internações do idoso',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Cria uma nova internação
    async create(req, res) {
        try {
            const { idoso_id, quarto_id, cama, motivo_entrada, data_entrada } = req.body;
            
            // Validações
            if (!idoso_id || !quarto_id || !cama) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do idoso, ID do quarto e cama são obrigatórios'
                });
            }

            // Verifica se o idoso existe
            const idoso = await IdosoRepository.findById(idoso_id);
            if (!idoso) {
                return res.status(404).json({
                    success: false,
                    message: 'Idoso não encontrado'
                });
            }

            // Verifica se o quarto existe e está disponível
            const quarto = await QuartoRepository.findById(quarto_id);
            if (!quarto) {
                return res.status(404).json({
                    success: false,
                    message: 'Quarto não encontrado'
                });
            }

            // Disponibilidade do quarto baseada em ocupação real (capacidade > internações ativas)
            const internacoesAtivasParaQuarto = await InternacaoRepository.getAtivas();
            const ocupadasNoQuarto = internacoesAtivasParaQuarto.filter(
                (i) => i.quarto_id === parseInt(quarto_id)
            ).length;
            if (ocupadasNoQuarto >= Number(quarto.capacidade || 0)) {
                return res.status(400).json({
                    success: false,
                    message: 'Quarto não está disponível'
                });
            }

            // Valida capacidade do quarto > 0
            if (!quarto.capacidade || Number(quarto.capacidade) < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Quarto sem capacidade disponível'
                });
            }

            // Verifica se o idoso já está internado
            const internacoesAtivas = internacoesAtivasParaQuarto;
const idosoJaInternado = internacoesAtivas.some(internacao => 
    internacao.idoso_id === parseInt(idoso_id) && internacao.status === 'ativa'
);

if (idosoJaInternado) {
    return res.status(400).json({
        success: false,
        message: 'Idoso já está internado'
    });
}

// Verifica se a cama já está ocupada no quarto selecionado
const camaOcupada = internacoesAtivas.some(internacao => 
    internacao.quarto_id === parseInt(quarto_id) && 
    internacao.cama === cama &&
    internacao.status === 'ativa'
);

if (camaOcupada) {
    return res.status(400).json({
        success: false,
        message: 'Cama já está ocupada no quarto selecionado'
    });
}

            // Normaliza data_entrada (aceita 'YYYY-MM-DD'); se não enviada, usa data atual
            let dataEntradaNormalizada = data_entrada;
            if (!dataEntradaNormalizada) {
                const hoje = new Date();
                const yyyy = hoje.getFullYear();
                const mm = String(hoje.getMonth() + 1).padStart(2, '0');
                const dd = String(hoje.getDate()).padStart(2, '0');
                dataEntradaNormalizada = `${yyyy}-${mm}-${dd}`;
            }

            const internacaoData = { idoso_id, quarto_id, cama, motivo_entrada, data_entrada: dataEntradaNormalizada };
            const novaInternacao = await InternacaoRepository.create(internacaoData);
            
            res.status(201).json({
                success: true,
                data: novaInternacao,
                message: 'Internação realizada com sucesso'
            });
        } catch (error) {
            console.error('Erro no create:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao realizar internação',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    async getCamasDisponiveis(req, res) {
        try {
            const { quartoId } = req.params;
            const camas = await InternacaoRepository.getCamasDisponiveis(quartoId);
            const camasFormatadas = camas.map(c => ({ id: c, nome: getCamaNome(c) }));

            res.json({
                success: true,
                data: camasFormatadas
            });
        } catch (error) {
            console.error('Erro ao buscar camas disponíveis:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar camas disponíveis',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Dar baixa em uma internação (antiga "finalizar")
    async darBaixa(req, res) {
        try {
            const { id } = req.params;
            const { motivo_saida } = req.body;

            // Buscar a internação primeiro usando o repositório
            const internacao = await InternacaoRepository.findById(id);
            
            if (!internacao) {
                return res.status(404).json({
                    success: false,
                    message: 'Internação não encontrada'
                });
            }

            // Finalizar a internação usando o repositório
            const finalizada = await InternacaoRepository.finalizarInternacao(id, motivo_saida || 'Baixa realizada sem motivo especificado');
            
            if (!finalizada) {
                return res.status(404).json({
                    success: false,
                    message: 'Internação não encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Baixa realizada com sucesso'
            });
        } catch (error) {
            console.error('Erro ao dar baixa:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao dar baixa na internação',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Mantém compatibilidade: endpoint antigo que redireciona para darBaixa
    async finalizar(req, res) {
        return this.darBaixa(req, res);
    }
    
}

module.exports = new InternacaoController();
/*
  Controlador de Internações
  - Abertura, acompanhamento e encerramento de internações.
*/
