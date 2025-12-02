const db = require('../config/database');

class InternacaoRepository {
    async findAll() {
        try {
            const [rows] = await db.query(`
                SELECT 
                    i.*, 
                    ido.nome as idoso_nome,
                    ido.cpf as idoso_cpf,
                    q.numero as quarto_numero,
                    q.capacidade as quarto_capacidade
                FROM internacoes i
                JOIN idosos ido ON i.idoso_id = ido.id
                JOIN quartos q ON i.quarto_id = q.id
                ORDER BY i.data_entrada DESC
            `);
            return rows;
        } catch (error) {
            throw new Error(`Erro ao buscar internações: ${error.message}`);
        }
    }

    async findById(id) {
        try {
            const [rows] = await db.execute(`
                SELECT 
                    i.*, 
                    ido.nome as idoso_nome,
                    ido.cpf as idoso_cpf,
                    q.numero as quarto_numero,
                    q.capacidade as quarto_capacidade
                FROM internacoes i
                JOIN idosos ido ON i.idoso_id = ido.id
                JOIN quartos q ON i.quarto_id = q.id
                WHERE i.id = ?
            `, [id]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Erro ao buscar internação: ${error.message}`);
        }
    }

    async create(internacaoData) {
        try {
            const { idoso_id, quarto_id, cama, motivo_entrada, data_entrada } = internacaoData;

            const [result] = await db.execute(
                `INSERT INTO internacoes 
                (idoso_id, quarto_id, cama, motivo_entrada, data_entrada) 
                VALUES (?, ?, ?, ?, ?)`,
                [idoso_id, quarto_id, cama, motivo_entrada, data_entrada]
            );

            // Atualiza o status do idoso para internado
            await db.execute(
                'UPDATE idosos SET status = "internado" WHERE id = ?',
                [idoso_id]
            );

            // Atualiza o status do quarto com base na ocupação atual
            await this._atualizarStatusQuartoPorOcupacao(quarto_id);

            return await this.findById(result.insertId);
        } catch (error) {
            throw new Error(`Erro ao criar internação: ${error.message}`);
        }
    }

    async finalizarInternacao(id, motivo_saida) {
        try {
            const internacao = await this.findById(id);
            if (!internacao) return null;

            const [result] = await db.execute(
                `UPDATE internacoes 
                SET data_saida = NOW(), motivo_saida = ?, status = "finalizada" 
                WHERE id = ?`,
                [motivo_saida, id]
            );

            if (result.affectedRows > 0) {
                // Atualiza o status do idoso para não internado
                await db.execute(
                    'UPDATE idosos SET status = "nao_internado" WHERE id = ?',
                    [internacao.idoso_id]
                );

                // Atualiza o status do quarto com base na ocupação atual
                await this._atualizarStatusQuartoPorOcupacao(internacao.quarto_id);
            }

            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Erro ao finalizar internação: ${error.message}`);
        }
    }

    // Finaliza todas as internações ativas de um idoso específico
    async finalizarPorIdoso(idosoId, motivo_saida = 'Baixa realizada via cadastro de idosos') {
        try {
            // Busca todas as internações ativas do idoso
            const [ativas] = await db.execute(
                `SELECT id, quarto_id FROM internacoes WHERE idoso_id = ? AND status = 'ativa'`,
                [idosoId]
            );

            let totalFinalizadas = 0;
            for (const row of ativas) {
                const ok = await this.finalizarInternacao(row.id, motivo_saida);
                if (ok) totalFinalizadas += 1;
            }

            // Log estruturado de auditoria
            const ts = new Date().toISOString();
            console.log(JSON.stringify({
                scope: 'internacoes',
                operation: 'bulk_finalize_by_idoso',
                timestamp: ts,
                idoso_id: Number(idosoId),
                totalAtivasAntes: Array.isArray(ativas) ? ativas.length : 0,
                totalFinalizadas
            }));

            return { totalAtivas: Array.isArray(ativas) ? ativas.length : 0, totalFinalizadas };
        } catch (error) {
            throw new Error(`Erro ao finalizar internações do idoso: ${error.message}`);
        }
    }

    async findByUsuarioId(usuarioId) {
        try {
            const [rows] = await db.execute(`
                SELECT 
                    i.*, 
                    q.numero as quarto_numero,
                    q.capacidade as quarto_capacidade
                FROM internacoes i
                JOIN quartos q ON i.quarto_id = q.id
                WHERE i.idoso_id = ? 
                ORDER BY i.data_entrada DESC
            `, [usuarioId]);
            return rows;
        } catch (error) {
            throw new Error(`Erro ao buscar internações do usuário: ${error.message}`);
        }
    }

    async getAtivas() {
    try {
        const [rows] = await db.execute(`
            SELECT 
                i.*, 
                ido.nome as idoso_nome,
                ido.cpf as idoso_cpf,
                q.numero as quarto_numero
            FROM internacoes i
            JOIN idosos ido ON i.idoso_id = ido.id
            JOIN quartos q ON i.quarto_id = q.id
            WHERE i.status = 'ativa'
            ORDER BY i.data_entrada DESC
        `);
        return rows;
    } catch (error) {
        console.error('Erro detalhado no repositório:', error);
        throw new Error(`Erro ao buscar internações ativas: ${error.message}`);
    }
}

    async getCamasDisponiveis(quartoId) {
        try {
            // Busca todas as camas ocupadas no quarto
            const [camasOcupadas] = await db.execute(
                `SELECT cama FROM internacoes 
                 WHERE quarto_id = ? AND status = 'ativa'`,
                [quartoId]
            );
        
            // Busca informações do quarto
            const [quarto] = await db.execute(
                'SELECT capacidade FROM quartos WHERE id = ?',
                [quartoId]
            );
        
            if (quarto.length === 0) {
                return [];
            }
        
            const capacidade = quarto[0].capacidade;
            const todasCamas = Array.from({length: capacidade}, (_, i) => 
                String.fromCharCode(65 + i) // A, B, C, etc.
            );
        
            // Filtra camas disponíveis
            const camasOcupadasSet = new Set(camasOcupadas.map(c => c.cama));
            const camasDisponiveis = todasCamas.filter(cama => 
                !camasOcupadasSet.has(cama)
            );
        
            return camasDisponiveis;
        } catch (error) {
            throw new Error(`Erro ao buscar camas disponíveis: ${error.message}`);
        }
    }

    async verificarCamaDisponivel(quartoId, cama) {
        try {
            const [rows] = await db.execute(`
                SELECT id FROM internacoes 
                WHERE quarto_id = ? AND cama = ? AND status = 'ativa'
            `, [quartoId, cama]);
            return rows.length === 0;
        } catch (error) {
            throw new Error(`Erro ao verificar disponibilidade da cama: ${error.message}`);
        }
    }

    // Helper: atualiza o status do quarto para 'ocupado' quando todas as camas estiverem ocupadas
    // ou 'disponivel' quando houver pelo menos uma cama livre
    async _atualizarStatusQuartoPorOcupacao(quartoId) {
        try {
            // Capacidade do quarto
            const [quartoRows] = await db.execute(
                'SELECT capacidade, status FROM quartos WHERE id = ?',
                [quartoId]
            );
            if (quartoRows.length === 0) return;
            const capacidade = quartoRows[0].capacidade;

            // Quantidade de camas ocupadas (internações ativas)
            const [ocupadasRows] = await db.execute(
                'SELECT COUNT(*) AS ocupadas FROM internacoes WHERE quarto_id = ? AND status = "ativa"',
                [quartoId]
            );
            const ocupadas = ocupadasRows[0].ocupadas || 0;

            const novoStatus = ocupadas >= capacidade ? 'ocupado' : 'disponivel';

            // Atualiza apenas se houver mudança
            if (quartoRows[0].status !== novoStatus) {
                await db.execute(
                    'UPDATE quartos SET status = ? WHERE id = ?',
                    [novoStatus, quartoId]
                );
                // Log padronizado de mudança de status no quarto
                const ts = new Date().toISOString();
                console.log(JSON.stringify({
                  scope: 'quartos',
                  operation: 'status_change',
                  timestamp: ts,
                  before: { id: quartoId, status: quartoRows[0].status },
                  after: { id: quartoId, status: novoStatus },
                  context: {
                    capacidade,
                    ocupadas
                  }
                }));
            }
        } catch (error) {
            console.error('Erro ao atualizar status do quarto por ocupação:', error.message);
            // Não lançar erro aqui para não quebrar o fluxo principal
        }
    }
}

module.exports = new InternacaoRepository();
/*
  Repositório de Internações
  - Persistência e consultas de internações ativas e histórico.
*/
