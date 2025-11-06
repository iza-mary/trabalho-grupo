const Doador = require("../models/doador");
const DoadorRepository = require("../repository/doadoRepository");
const DoacaoRepository = require("../repository/doacaoRepository");
const normalizeRG = (v) => String(v || '').replace(/\D/g, '');
const normalizeDocOrNull = (v) => {
    if (v === null || v === undefined) return null;
    const digits = String(v).replace(/\D/g, '');
    return digits.length ? digits : null;
};

class DoadorController {
    async getAll(req, res) {
        try {
            const doadores = await DoadorRepository.findAll();
            res.json({
                success: true,
                data: doadores.map(doadr => doadr.toJSON()),
                total: doadores.length
            })
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            })
        }
    }
    
    async getByBusca(req, res) {
        try {
            const {filtros} = req.body;
            const doadores = await DoadorRepository.getByBusca(filtros)
            res.json({
                success: true,
                data: doadores.map(doadr => doadr.toJSON()),
                total: doadores.length
            })
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            })
        }
    }

    async create(req, res) {
        try {
            const body = { 
                ...req.body, 
                rg: normalizeRG(req.body?.rg),
                cpf: normalizeDocOrNull(req.body?.cpf),
                cnpj: normalizeDocOrNull(req.body?.cnpj)
            };
            const doador = new Doador(body);
            const errors = doador.validate();
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Dados inválidos",
                    errors
                })
            }
            const newDoador = await DoadorRepository.create(doador)
            res.status(201).json({
                success: true,
                data: newDoador.toJSON(),
                message: "Doador gravado com sucesso"
            })
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            })
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const doador = await DoadorRepository.findById(id)
            if (!doador) {
                return res.status(404).json({
                    success: false,
                    message: "Doador não encontrado"
                })
            }
            res.json({
                success: true,
                data: doador.toJSON()
            })
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            })
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const doadorExistente = await DoadorRepository.findById(id);
            if (!doadorExistente) {
                res.status(404).json({
                    success: false,
                    message: "Doador não encontrado"
                })
            }
            const body = { 
                ...req.body, 
                rg: normalizeRG(req.body?.rg),
                cpf: normalizeDocOrNull(req.body?.cpf),
                cnpj: normalizeDocOrNull(req.body?.cnpj)
            };
            const doador = new Doador({ ...body, id })
            const errors = doador.validate();
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Dados inválidos",
                    errors
                })
            }
            const doadorAtualizado = await DoadorRepository.update(id, doador);
            return res.json({
                success: true,
                data: doadorAtualizado.toJSON(),
                message: "Doador atualizado com sucesso"
            })
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            })
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            const doador = await DoadorRepository.findById(id);
            if (!doador) {
                return res.status(404).json({
                    success: false,
                    message: "Doador não encontrado"
                })
            }

            // Antes de excluir, verifica se há doações vinculadas ao doador
            const db = require('../config/database');
            try {
                const [rows] = await db.execute('SELECT COUNT(*) AS total FROM doacoes WHERE doador = ?', [id]);
                const totalDoacoes = Number(rows?.[0]?.total || 0);
                if (totalDoacoes > 0) {
                    return res.status(409).json({
                        success: false,
                        message: `Este doador não pode ser excluído pois possui ${totalDoacoes} doação(ões) registrada(s) no sistema. Para remover este cadastro, primeiro é necessário excluir todas as doações associadas ou entrar em contato com o administrador do sistema.`,
                        totalDoacoes
                    });
                }
            } catch (countErr) {
                // Se falhar a verificação, continua com a lógica de exclusão e deixa o erro do banco se manifestar
            }

            const deleted = await DoadorRepository.delete(id)
            if (deleted) {
                return res.json({
                    success: true,
                    message: "Doador deletado com sucesso"
                })
            }
            return res.status(404).json({ success: false, message: 'Doador não encontrado' });
        } catch (error) {
            const msg = String(error?.message || '');
            if (msg.includes('foreign key constraint fails') || msg.includes('ER_ROW_IS_REFERENCED')) {
                return res.status(409).json({ success: false, message: 'Não é possível excluir: doações associadas impedem a deleção.' });
            }
            res.status(500).json({
                success: false,
                message: error.message
            })
        }
    }

    async getFicha(req, res) {
        try {
            const { id } = req.params;
            const doador = await DoadorRepository.findById(id);
            if (!doador) {
                return res.status(404).json({ success: false, message: 'Doador não encontrado' });
            }

            // Busca doações relacionadas diretamente por doadorId
            const historico = await DoacaoRepository.findByDoadorId(id);

            const historicoDoacoes = (historico || []).map(d => {
                const base = d.toJSON();
                const isDinheiro = base.tipo === 'D';
                const valor = isDinheiro ? base.doacao?.valor ?? null : null;
                const item = !isDinheiro ? base.doacao?.item ?? null : null;
                const quantidade = !isDinheiro ? base.doacao?.qntd ?? null : null;
                const unidade = !isDinheiro ? base.doacao?.unidade_medida ?? null : null;
                const destinatario = base.idoso ? String(base.idoso) : 'Instituição';
                return {
                    id: base.id,
                    data: base.data,
                    tipo: base.tipo,
                    valor,
                    item,
                    quantidade,
                    unidade,
                    destinatario,
                    evento: base.evento || null,
                    obs: base.obs || null,
                };
            });

            // Monta ficha agregada mantendo padrões próximos ao IdosoFicha
            const dados = doador.toJSON();
            const isPJ = !!(dados.cnpj && String(dados.cnpj).trim().length > 0);
            const ficha = {
                dadosPessoais: {
                    nome: dados.nome,
                    tipo: isPJ ? 'Pessoa Jurídica' : 'Pessoa Física',
                    documentos: {
                        cpf: isPJ ? null : dados.cpf,
                        cnpj: isPJ ? dados.cnpj : null,
                        rg: dados.rg || null,
                    },
                    representante: isPJ ? (dados.representante || null) : null,
                    contatos: {
                        telefone: dados.telefone || null,
                        email: dados.email || null,
                    },
                    endereco: {
                        rua: dados.rua || '',
                        numero: dados.numero || '',
                        complemento: dados.complemento || '',
                        cidade: dados.cidade || '',
                        estado: null,
                        cep: dados.cep || '',
                    },
                },
                historicoDoacoes,
                observacoes: {
                    status: 'Ativo',
                    texto: null,
                },
            };

            return res.json({ success: true, data: ficha });
        } catch (error) {
            console.error('Erro ao montar ficha do doador:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new DoadorController();