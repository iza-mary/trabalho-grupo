-- 1. Estados
CREATE TABLE `estados` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(50) NOT NULL,
  `uf` varchar(2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Quartos
CREATE TABLE `quartos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `numero` varchar(10) NOT NULL,
  `capacidade` int(11) NOT NULL DEFAULT 2,
  `descricao` varchar(255) DEFAULT NULL,
  `status` enum('disponivel','ocupado') DEFAULT 'disponivel',
  `data_cadastro` timestamp NOT NULL DEFAULT current_timestamp(),
  `data_atualizacao` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero` (`numero`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. Doadores
CREATE TABLE `doadores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `cpf` varchar(14) DEFAULT NULL,
  `cnpj` varchar(18) DEFAULT NULL,
  `telefone` varchar(20) NOT NULL,
  `rg` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `rua` varchar(100) DEFAULT NULL,
  `numero` varchar(10) DEFAULT NULL,
  `cep` varchar(9) DEFAULT NULL,
  `complemento` varchar(100) DEFAULT NULL,
  `data_cadastro` timestamp NOT NULL DEFAULT current_timestamp(),
  `data_atualizacao` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `cpf` (`cpf`),
  UNIQUE KEY `cnpj` (`cnpj`),
  KEY `idx_nome` (`nome`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4. Eventos
CREATE TABLE `eventos` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `titulo` varchar(200) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `cor` varchar(20) DEFAULT NULL,
  `data_inicio` date NOT NULL,
  `data_fim` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fim` time NOT NULL,
  `local` varchar(150) NOT NULL,
  `descricao` text NOT NULL,
  `notificar` tinyint(1) NOT NULL DEFAULT 0,
  `tempo_notificacao` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_data_inicio` (`data_inicio`,`hora_inicio`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_titulo` (`titulo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 5. Produtos
CREATE TABLE `produtos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `categoria` enum('Alimentos','Higiene','Medicamentos','Roupas','Limpeza','Outros') NOT NULL,
  `unidade_medida` enum('Unidade','Kg','L','Pacote','Caixa','Outro') NOT NULL DEFAULT 'Unidade',
  `estoque_atual` int(11) NOT NULL DEFAULT 0,
  `estoque_minimo` int(11) NOT NULL DEFAULT 0,
  `observacao` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `descricao` text DEFAULT NULL,
  `preco` decimal(10,2) NOT NULL DEFAULT 0.00,
  `quantidade` int(11) NOT NULL DEFAULT 0,
  `data_cadastro` datetime NOT NULL DEFAULT current_timestamp(),
  `data_atualizacao` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `nome_norm` varchar(255) GENERATED ALWAYS AS (LOWER(TRIM(`nome`))) STORED,
  PRIMARY KEY (`id`),
  KEY `idx_produtos_nome` (`nome`),
  KEY `idx_produtos_categoria` (`categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 6. Financeiro (CRIADA ANTES das doações em dinheiro)
CREATE TABLE `financeiro` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `descricao` varchar(255) NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `tipo` enum('Entrada','Saída') NOT NULL,
  `categoria` enum('Doações','Patrocínios','Salários','Fornecedores','Manutenção','Outros') NOT NULL,
  `forma_pagamento` enum('Dinheiro','PIX','Transferência Bancária','Cartão de Débito','Cartão de Crédito','Cheque') NOT NULL,
  `recorrente` tinyint(1) NOT NULL DEFAULT 0,
  `frequencia_recorrencia` enum('Diária','Semanal','Mensal','Bimestral','Trimestral','Semestral','Anual') DEFAULT NULL,
  `ocorrencias_recorrencia` int(11) DEFAULT NULL,
  `data` date NOT NULL,
  `observacao` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_financeiro_data` (`data`),
  KEY `idx_financeiro_tipo` (`tipo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 7. Idosos
CREATE TABLE `idosos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `data_nascimento` date NOT NULL,
  `genero` enum('Masculino','Feminino','Outro') NOT NULL,
  `rg` varchar(20) NOT NULL,
  `cpf` varchar(14) NOT NULL,
  `cartao_sus` varchar(15) NOT NULL,
  `telefone` varchar(15) NOT NULL,
  `rua` varchar(100) NOT NULL,
  `numero` varchar(10) NOT NULL,
  `complemento` varchar(50) DEFAULT NULL,
  `cidade` varchar(50) NOT NULL,
  `estado_id` int(11) NOT NULL,
  `cep` varchar(9) NOT NULL,
  `status` enum('internado','nao_internado') DEFAULT 'nao_internado',
  `observacoes` text DEFAULT NULL,
  `data_cadastro` timestamp NOT NULL DEFAULT current_timestamp(),
  `data_atualizacao` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `cpf` (`cpf`),
  KEY `fk_estado` (`estado_id`),
  CONSTRAINT `fk_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 8. Internacoes
CREATE TABLE `internacoes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idoso_id` int(11) NOT NULL,
  `quarto_id` int(11) NOT NULL,
  `cama` varchar(10) NOT NULL,
  `data_entrada` date NOT NULL,
  `data_saida` date DEFAULT NULL,
  `motivo_entrada` text DEFAULT NULL,
  `motivo_saida` text DEFAULT NULL,
  `status` enum('ativa','finalizada') DEFAULT 'ativa',
  `observacoes` text DEFAULT NULL,
  `data_cadastro` timestamp NOT NULL DEFAULT current_timestamp(),
  `data_atualizacao` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_idoso` (`idoso_id`),
  KEY `fk_quarto` (`quarto_id`),
  CONSTRAINT `fk_idoso` FOREIGN KEY (`idoso_id`) REFERENCES `idosos` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_quarto` FOREIGN KEY (`quarto_id`) REFERENCES `quartos` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 9. Doacoes
CREATE TABLE `doacoes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `data` datetime NOT NULL,
  `tipo` enum('D','A','O') NOT NULL COMMENT 'D=Doação em Dinheiro, A=Doação em Alimentos/Produtos, O=Outros',
  `obs` text DEFAULT NULL,
  `doador` int(11) NOT NULL,
  `idoso` varchar(255) DEFAULT NULL,
  `idoso_id` int(11) DEFAULT NULL,
  `evento_id` int(10) unsigned DEFAULT NULL,
  `data_cadastro` timestamp NOT NULL DEFAULT current_timestamp(),
  `data_atualizacao` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_doacoes_doador` (`doador`),
  KEY `idx_doacoes_tipo` (`tipo`),
  KEY `idx_doacoes_data` (`data`),
  KEY `idx_doacoes_idoso_id` (`idoso_id`),
  KEY `idx_doacoes_evento_id` (`evento_id`),
  CONSTRAINT `fk_doacoes_doador` FOREIGN KEY (`doador`) REFERENCES `doadores` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_doacoes_evento` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_doacoes_idoso` FOREIGN KEY (`idoso_id`) REFERENCES `idosos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 10. DoacaoDinheiro (COMUNICAÇÃO COM FINANCEIRO)
CREATE TABLE `doacaodinheiro` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `doacao_id` int(11) NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `financeiro_id` int(11) NOT NULL,
  `data_cadastro` timestamp NOT NULL DEFAULT current_timestamp(),
  `data_atualizacao` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_financeiro_id` (`financeiro_id`),
  KEY `idx_doacaodinheiro_doacao_id` (`doacao_id`),
  CONSTRAINT `fk_doacaodinheiro_doacao` FOREIGN KEY (`doacao_id`) REFERENCES `doacoes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_doacaodinheiro_financeiro` FOREIGN KEY (`financeiro_id`) REFERENCES `financeiro` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 11. DoacaoProduto
CREATE TABLE `doacaoproduto` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `doacao_id` int(11) NOT NULL,
  `produto_id` int(11) NOT NULL,
  `unidade_medida` enum('Unidade','Kg','L','Pacote','Caixa','Outro') NOT NULL DEFAULT 'Unidade',
  `quantidade` int(11) NOT NULL,
  `observacao` text DEFAULT NULL,
  `data_cadastro` timestamp NOT NULL DEFAULT current_timestamp(),
  `data_atualizacao` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_doacaoproduto_doacao_produto` (`doacao_id`, `produto_id`),
  KEY `idx_doacaoproduto_doacao_id` (`doacao_id`),
  KEY `idx_doacaoproduto_produto_id` (`produto_id`),
  CONSTRAINT `fk_doacaoproduto_doacao` FOREIGN KEY (`doacao_id`) REFERENCES `doacoes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_doacaoproduto_produto` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 12. Users
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_username` (`username`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 13. MovimentosEstoque
CREATE TABLE `movimentos_estoque` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `produto_id` int(11) NOT NULL,
  `data_hora` timestamp NOT NULL DEFAULT current_timestamp(),
  `tipo` enum('entrada','saida','ajuste') NOT NULL,
  `quantidade` int(11) NOT NULL,
  `saldo_anterior` int(11) NOT NULL,
  `saldo_posterior` int(11) NOT NULL,
  `doacao_id` int(11) DEFAULT NULL,
  `responsavel_id` int(11) DEFAULT NULL,
  `responsavel_nome` varchar(100) DEFAULT NULL,
  `motivo` text DEFAULT NULL,
  `observacao` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_produto_data` (`produto_id`,`data_hora`),
  KEY `idx_doacao` (`doacao_id`),
  CONSTRAINT `fk_mov_produto` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_mov_doacao` FOREIGN KEY (`doacao_id`) REFERENCES `doacoes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 14. Notificacoes
CREATE TABLE `notificacoes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tipo` enum('cadastro','estoque_baixo','transacao_financeira','evento_proximo') NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `descricao` text NOT NULL,
  `prioridade` enum('baixa','normal','alta','critica') NOT NULL DEFAULT 'normal',
  `lida` tinyint(1) NOT NULL DEFAULT 0,
  `usuario_id` int(11) DEFAULT NULL,
  `referencia_id` int(11) DEFAULT NULL,
  `referencia_tipo` enum('produto','evento','doacao','financeiro','idoso','doador','quarto') DEFAULT NULL,
  `data_criacao` datetime NOT NULL DEFAULT current_timestamp(),
  `data_leitura` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_notificacoes_usuario` (`usuario_id`),
  KEY `idx_notificacoes_tipo` (`tipo`),
  KEY `idx_notificacoes_prioridade` (`prioridade`),
  KEY `idx_notificacoes_data_criacao` (`data_criacao`),
  KEY `idx_notificacoes_lida` (`lida`),
  KEY `idx_notificacoes_referencia` (`referencia_tipo`,`referencia_id`),
  CONSTRAINT `fk_notificacoes_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
