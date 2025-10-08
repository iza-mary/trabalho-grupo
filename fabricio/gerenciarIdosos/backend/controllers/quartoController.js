const QuartoRepository = require('../repository/quartoRepository');
const db = require('../config/database');

class QuartoController {
    // Obtém todos os quartos
    async getAll(req, res) {
        try {
            const { search, status } = req.query;
            let quartos;
            if (search || status) {
                quartos = await QuartoRepository.search(search, status);
            } else {
                quartos = await QuartoRepository.findAll();
            }
            res.json({
                success: true,
                data: quartos
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar quartos',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtém quartos disponíveis
    async getDisponiveis(req, res) {
        try {
            const [quartos] = await db.execute(`
                SELECT q.*,
                       COALESCE(COUNT(i.id), 0) AS ocupadas
                FROM quartos q
                LEFT JOIN internacoes i 
                  ON i.quarto_id = q.id 
                 AND i.status = 'ativa'
                GROUP BY q.id
                HAVING q.capacidade > COALESCE(COUNT(i.id), 0)
            `);
            res.json({
                success: true,
                data: quartos
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar quartos disponíveis',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtém um quarto por ID
    async getById(req, res) {
        try {
            const { id } = req.params;
            const quarto = await QuartoRepository.findById(id);
            
            if (!quarto) {
                return res.status(404).json({
                    success: false,
                    message: 'Quarto não encontrado'
                });
            }
            
            res.json({
                success: true,
                data: quarto
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar quarto',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Cria um novo quarto
    async create(req, res) {
        try {
            const { numero, capacidade, descricao } = req.body;
            
            // Validações
            if (!numero || !capacidade) {
                return res.status(400).json({
                    success: false,
                    message: 'Número e capacidade são obrigatórios'
                });
            }
            
            if (capacidade < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Capacidade deve ser maior que zero'
                });
            }

            const quartoData = { numero, capacidade, descricao };
            const novoQuarto = await QuartoRepository.create(quartoData);
            
            res.status(201).json({
                success: true,
                data: novoQuarto,
                message: 'Quarto criado com sucesso'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erro ao criar quarto',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Atualiza um quarto
    async update(req, res) {
        try {
            const { id } = req.params;
            const { numero, capacidade, descricao, status } = req.body;
            
            // Validações
            if (capacidade && capacidade < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Capacidade deve ser maior que zero'
                });
            }

            const quartoData = { numero, capacidade, descricao, status };
            const quartoAtualizado = await QuartoRepository.update(id, quartoData);
            
            if (!quartoAtualizado) {
                return res.status(404).json({
                    success: false,
                    message: 'Quarto não encontrado'
                });
            }
            
            res.json({
                success: true,
                data: quartoAtualizado,
                message: 'Quarto atualizado com sucesso'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erro ao atualizar quarto',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Remove um quarto
    async delete(req, res) {
        try {
            const { id } = req.params;
            const deletado = await QuartoRepository.delete(id);
            
            if (!deletado) {
                return res.status(404).json({
                    success: false,
                    message: 'Quarto não encontrado'
                });
            }
            
            res.json({
                success: true,
                message: 'Quarto excluído com sucesso'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erro ao excluir quarto',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = new QuartoController();