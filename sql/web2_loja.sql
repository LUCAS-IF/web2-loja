-- Banco de dados da atividade de Desenvolvimento Web 2.
-- Execute no Workbench usando uma conexão administrativa (root).

CREATE DATABASE IF NOT EXISTS web2_loja
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE web2_loja;

-- Categorias disponíveis para classificação dos produtos.
CREATE TABLE IF NOT EXISTS categoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL UNIQUE
);

-- categoria_id é opcional; ao excluir uma categoria, o produto permanece sem categoria.
CREATE TABLE IF NOT EXISTS produto (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  estoque INT NOT NULL DEFAULT 0,
  categoria_id INT NULL,
  CONSTRAINT chk_produto_preco CHECK (preco >= 0),
  CONSTRAINT chk_produto_estoque CHECK (estoque >= 0),
  CONSTRAINT fk_produto_categoria
    FOREIGN KEY (categoria_id)
    REFERENCES categoria(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

-- Carga inicial idempotente: executar novamente não duplica os registros de exemplo.
INSERT IGNORE INTO categoria (nome) VALUES
  ('Eletrônicos'),
  ('Papelaria'),
  ('Acessórios');

INSERT INTO produto (nome, preco, estoque, categoria_id)
SELECT 'Teclado USB', 89.90, 15, c.id
FROM categoria c
WHERE c.nome = 'Eletrônicos'
  AND NOT EXISTS (SELECT 1 FROM produto p WHERE p.nome = 'Teclado USB');

INSERT INTO produto (nome, preco, estoque, categoria_id)
SELECT 'Mouse sem fio', 59.90, 30, c.id
FROM categoria c
WHERE c.nome = 'Eletrônicos'
  AND NOT EXISTS (SELECT 1 FROM produto p WHERE p.nome = 'Mouse sem fio');

INSERT INTO produto (nome, preco, estoque, categoria_id)
SELECT 'Caderno 10 mat.', 24.50, 50, c.id
FROM categoria c
WHERE c.nome = 'Papelaria'
  AND NOT EXISTS (SELECT 1 FROM produto p WHERE p.nome = 'Caderno 10 mat.');

INSERT INTO produto (nome, preco, estoque, categoria_id)
SELECT 'Caneta azul', 2.30, 200, c.id
FROM categoria c
WHERE c.nome = 'Papelaria'
  AND NOT EXISTS (SELECT 1 FROM produto p WHERE p.nome = 'Caneta azul');

-- Conferência final dos dados iniciais.
SELECT * FROM categoria ORDER BY id;
SELECT * FROM produto ORDER BY id;
