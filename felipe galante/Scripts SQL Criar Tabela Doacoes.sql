CREATE TABLE doacoes (
id INT PRIMARY KEY auto_increment,
data DATE NOT NULL,
tipo CHAR(1) NOT NULL, -- "D" Dinheiro, "A" Alimento , "O" Outros
obs CHAR(150),
doador INT NOT NULL,
idoso INT,
evento INT,
CONSTRAINT fk_doacaoDoador
FOREIGN KEY (doador) REFERENCES doadores(id)
);

CREATE TABLE doacaoDinheiro (
id INT PRIMARY KEY,
valor DECIMAL(10,2) NOT NULL,
CONSTRAINT fk_doacaoDinheiro
FOREIGN KEY (id) REFERENCES doacoes(id) ON DELETE CASCADE
);

CREATE TABLE doacaoProduto (
id INT PRIMARY KEY,
item CHAR(50) NOT NULL,
qntd INT NOT NULL,
CONSTRAINT fk_doacaoProduto
FOREIGN KEY (id) REFERENCES doacoes(id) ON DELETE CASCADE
);