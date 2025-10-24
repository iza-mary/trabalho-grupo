CREATE TABLE `quartos` (
   `id` int NOT NULL AUTO_INCREMENT,
   `numero` int NOT NULL,
   `tipo` varchar(50) DEFAULT NULL,
   `leitos` int DEFAULT NULL,
   `ocupacao` int DEFAULT NULL,
   `status` varchar(20) DEFAULT NULL,
   `andar` varchar(50) DEFAULT NULL,
   `observacao` text,
   PRIMARY KEY (`id`),
   UNIQUE KEY `numero` (`numero`)
 ) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci