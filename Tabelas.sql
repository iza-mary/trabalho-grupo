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
  CONSTRAINT `fk_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci

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
  CONSTRAINT `fk_idoso` FOREIGN KEY (`idoso_id`) REFERENCES `idosos` (`id`),
  CONSTRAINT `fk_quarto` FOREIGN KEY (`quarto_id`) REFERENCES `quartos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci

CREATE TABLE `quartos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `numero` varchar(10) NOT NULL,
  `capacidade` int(11) NOT NULL DEFAULT 2,
  `descricao` varchar(255) DEFAULT NULL,
  `status` enum('ativo','inativo') DEFAULT 'ativo',
  `data_cadastro` timestamp NOT NULL DEFAULT current_timestamp(),
  `data_atualizacao` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero` (`numero`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci

CREATE TABLE `doadores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `cpf` varchar(14) NOT NULL,
  `telefone` varchar(20) NOT NULL,
  `rg` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `rua` varchar(100) DEFAULT NULL,
  `numero` varchar(10) DEFAULT NULL,
  `cep` varchar(9) DEFAULT NULL,
  `complemento` varchar(100) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `data_cadastro` timestamp NOT NULL DEFAULT current_timestamp(),
  `data_atualizacao` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `cpf` (`cpf`),
  KEY `idx_nome` (`nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci

CREATE TABLE `doacoes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `data` datetime NOT NULL,
  `tipo` enum('D','A','O') NOT NULL,
  `obs` text DEFAULT NULL,
  `doador` int(11) NOT NULL,
  `idoso` varchar(255) DEFAULT NULL,
  `idoso_id` int(11) DEFAULT NULL,
  `evento` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_doacoes_doador` (`doador`),
  KEY `idx_doacoes_tipo` (`tipo`),
  KEY `idx_doacoes_data` (`data`),
  KEY `idx_doacoes_idoso_id` (`idoso_id`),
  CONSTRAINT `fk_doacoes_doador` FOREIGN KEY (`doador`) REFERENCES `doadores` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_doacoes_idoso` FOREIGN KEY (`idoso_id`) REFERENCES `idosos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci

CREATE TABLE `doacaoproduto` (
  `id` int(11) NOT NULL,
  `item` varchar(255) NOT NULL,
  `qntd` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_doacaoproduto_doacao` FOREIGN KEY (`id`) REFERENCES `doacoes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci

CREATE TABLE `doacaodinheiro` (
  `id` int(11) NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_doacaodinheiro_doacao` FOREIGN KEY (`id`) REFERENCES `doacoes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci