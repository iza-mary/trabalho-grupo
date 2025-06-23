const db = require('../config/database');
const Idoso = require('../models/idoso');

class IdosoRepository {
    // Busca todos os idosos no banco de dados
    async findAll() {
        console.log('Iniciando busca por idosos...');
        try {
            // Executa a query SQL
            const [rows] = await db.query('SELECT * FROM idosos');
            console.log(`Encontrados ${rows.length} registros`);
                
            // Mapeia os resultados para objetos Idoso
            return rows.map(row => {
                // Prepara os dados para o construtor do Idoso
                const dbData = {
                    id: row.id,
                    nome: row.nome,
                    dataNascimento: row.data_nascimento,
                    genero: row.genero,
                    rg: row.rg,
                    cpf: row.cpf,
                    cartaoSus: row.cartao_sus,
                    telefone: row.telefone,
                    rua: row.rua,
                    numero: row.numero,
                    complemento: row.complemento,
                    cidade: row.cidade,
                    estadoId: row.estado_id,
                    estado: row.estado_id,
                    cep: row.cep,
                    status: row.status,
                    dataEntrada: row.data_entrada,
                    quarto: row.quarto,
                    cama: row.cama,
                    observacoes: row.observacoes,
                    dataCadastro: row.data_cadastro,
                    dataAtualizacao: row.data_atualizacao
                };

                try {
                    // Cria uma instância de Idoso com os dados do banco
                    return new Idoso(dbData);
                } catch (error) {
                    console.error(`Failed to process elderly ID ${row.id}:`, error.message);
                    // Se houver erro, retorna um objeto de erro padronizado
                    return this.createErrorResponse(row, error);
                }
            });
        } catch (error) {
            console.error('Repository error:', error);
            throw error;
        }
    }

    // Cria um objeto de resposta de erro padronizado
    createErrorResponse(row, error) {
        return {
            id: row.id,
            nome: row.nome || 'Invalid record',
            error: 'Data inconsistency',
            // Mostra detalhes do erro apenas em desenvolvimento
            systemError: process.env.NODE_ENV === 'development' ? error.message : undefined,
            rawData: process.env.NODE_ENV === 'development' ? {
                rg: row.rg,
                cpf: row.cpf,
                cartaoSus: row.cartao_sus,
                telefone: row.telefone,
                cep: row.cep
            } : undefined
        };
    }

    // Busca um idoso por ID
    async findById(id) {
        try {
            // Executa a query SQL com parâmetro
            const [rows] = await db.execute('SELECT * FROM idosos WHERE id = ?', [id]);
            
            // Se não encontrar, retorna null
            if (rows.length === 0) return null;

            const row = rows[0];
            
            // Prepara os dados para o construtor do Idoso
            const dbData = {
                id: row.id,
                nome: row.nome,
                dataNascimento: row.data_nascimento,
                genero: row.genero,
                rg: row.rg,
                cpf: row.cpf,
                cartaoSus: row.cartao_sus,
                telefone: row.telefone,
                rua: row.rua,
                numero: row.numero,
                complemento: row.complemento,
                cidade: row.cidade,
                estadoId: row.estado_id,
                cep: row.cep,
                status: row.status,
                dataEntrada: row.data_entrada,
                quarto: row.quarto,
                cama: row.cama,
                observacoes: row.observacoes
            };

            // Retorna uma nova instância de Idoso
            return new Idoso(dbData);
        } catch (error) {
            throw new Error(`Erro ao buscar idoso: ${error.message}`);
        }
    }

    // Cria um novo idoso no banco de dados
    async create(idosoData) {
        try {
            // Extrai os campos necessários do objeto idosoData
            const { nome, dataNascimento, genero, rg, cpf, cartaoSus, telefone, rua, numero, 
                   complemento, cidade, estadoId, cep, status, dataEntrada, quarto, cama, 
                   observacoes } = idosoData;
            
            // Executa a query de inserção
            const [result] = await db.execute(
                `INSERT INTO idosos 
                (nome, data_nascimento, genero, rg, cpf, cartao_sus, telefone, rua, numero, 
                 complemento, cidade, estado_id, cep, status, data_entrada, quarto, cama, 
                 observacoes, data_cadastro) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [nome, dataNascimento, genero, rg, cpf, cartaoSus, telefone, rua, numero, 
                 complemento, cidade, estadoId, cep, status, dataEntrada, quarto, cama, 
                 observacoes]
            );

            // Retorna o idoso recém-criado buscando pelo ID
            return await this.findById(result.insertId);
        } catch (error) {
            throw new Error(`Erro ao criar idoso: ${error.message}`);
        }
    }

    // Atualiza um idoso existente
    async update(id, idosoData) {
        try {
            // Extrai os campos necessários do objeto idosoData
            const { nome, dataNascimento, genero, rg, cpf, cartaoSus, telefone, rua, numero, 
                   complemento, cidade, estadoId, cep, status, dataEntrada, quarto, cama, 
                   observacoes } = idosoData;
            
            // Executa a query de atualização
            const [result] = await db.execute(
                `UPDATE idosos SET 
                nome = ?, data_nascimento = ?, genero = ?, rg = ?, cpf = ?, cartao_sus = ?, 
                telefone = ?, rua = ?, numero = ?, complemento = ?, cidade = ?, estado_id = ?, 
                cep = ?, status = ?, data_entrada = ?, quarto = ?, cama = ?, observacoes = ?, 
                data_atualizacao = NOW() 
                WHERE id = ?`,
                [nome, dataNascimento, genero, rg, cpf, cartaoSus, telefone, rua, numero, 
                 complemento, cidade, estadoId, cep, status, dataEntrada, quarto, cama, 
                 observacoes, id]
            );

            // Se nenhum registro foi afetado, retorna null
            if (result.affectedRows === 0) {
                return null;
            }

            // Retorna o idoso atualizado buscando pelo ID
            return await this.findById(id);
        } catch (error) {
            console.error('Erro detalhado no repositório:', error);
            throw new Error(`Erro ao atualizar idoso: ${error.message}`);
        }
    }

    // Remove um idoso do banco de dados
    async delete(id) {
        try {
            // Executa a query de deleção
            const [result] = await db.execute('DELETE FROM idosos WHERE id = ?', [id]);
            
            // Retorna true se algum registro foi deletado
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Erro ao excluir idoso: ${error.message}`);
        }
    }
}

module.exports = new IdosoRepository();