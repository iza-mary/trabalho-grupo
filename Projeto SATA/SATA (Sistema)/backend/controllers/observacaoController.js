const observacaoRepository = require('../repository/observacaoRepository.js');

class ObservacaoController {

    async list(req, res) {
        try {
            const { idosoId } = req.params;
            const observacoes = await observacaoRepository.findByIdoso(idosoId);
            res.json({ success: true, data: observacoes });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async create(req, res) {
        try {
            const { idosoId } = req.params;
            const { observacao, usuario_id } = req.body;

            if (!observacao || String(observacao).trim() === '') {
                return res.status(400).json({ success: false, message: 'A observação não pode estar vazia.' });
            }

            const novaObservacao = await observacaoRepository.create(idosoId, usuario_id, observacao);
            res.status(201).json({ success: true, data: novaObservacao });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async update(req, res) {
        try {
            const { idosoId, obsId } = req.params;
            const { observacao } = req.body;

            if (!observacao || String(observacao).trim() === '') {
                return res.status(400).json({ success: false, message: 'A observação não pode estar vazia.' });
            }

            const existe = await observacaoRepository.findById(obsId, idosoId);
            if (!existe) {
                return res.status(404).json({ success: false, message: 'Observação não encontrada.' });
            }

            const observacaoAtualizada = await observacaoRepository.update(obsId, idosoId, observacao);
            res.json({ success: true, data: observacaoAtualizada });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async delete(req, res) {
        try {
            const { idosoId, obsId } = req.params;

            const existe = await observacaoRepository.findById(obsId, idosoId);
            if (!existe) {
                return res.status(404).json({ success: false, message: 'Observação não encontrada.' });
            }

            const deletado = await observacaoRepository.delete(obsId, idosoId);
            if (deletado) {
                return res.json({ success: true, message: 'Observação excluída com sucesso' });
            }
            return res.status(500).json({ success: false, message: 'Falha ao excluir a observação.' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new ObservacaoController();
