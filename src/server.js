import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Encaminha erros das rotas assíncronas ao middleware central.
const asyncRoute = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

function obterIdValido(valor) {
  const id = Number(valor);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function validarProduto(body = {}) {
  const nome = String(body.nome ?? '').trim();
  const precoTexto = String(body.preco ?? '').trim();
  const estoqueTexto = String(body.estoque ?? '0').trim();
  const categoriaTexto = body.categoria_id ?? '';

  if (!nome || nome.length > 100) {
    return { erro: 'Informe um nome com até 100 caracteres.' };
  }

  // DECIMAL(10,2): até 8 dígitos inteiros e 2 casas decimais.
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(precoTexto)) {
    return { erro: 'Informe um preço válido, maior ou igual a zero, com até 2 casas decimais.' };
  }

  const preco = Number(precoTexto);
  const estoque = Number(estoqueTexto);
  if (!Number.isSafeInteger(estoque) || estoque < 0) {
    return { erro: 'O estoque deve ser um número inteiro maior ou igual a zero.' };
  }

  let categoria_id = null;
  if (categoriaTexto !== '' && categoriaTexto !== null) {
    categoria_id = Number(categoriaTexto);
    if (!Number.isSafeInteger(categoria_id) || categoria_id <= 0) {
      return { erro: 'Selecione uma categoria válida.' };
    }
  }

  return { dados: { nome, preco, estoque, categoria_id } };
}

// GET /produtos: lista todos os produtos ou filtra por nome.
// O termo é enviado como parâmetro para evitar SQL Injection.
app.get('/produtos', asyncRoute(async (req, res) => {
  const busca = String(req.query.busca ?? '').trim();

  if (busca) {
    const termo = `%${busca}%`;
    const [rows] = await pool.execute(
      `SELECT p.id, p.nome, p.preco, p.estoque, p.categoria_id,
              c.nome AS categoria_nome
       FROM produto p
       LEFT JOIN categoria c ON c.id = p.categoria_id
       WHERE p.nome LIKE ?
       ORDER BY p.id`,
      [termo],
    );
    return res.json(rows);
  }

  const [rows] = await pool.execute(
    `SELECT p.id, p.nome, p.preco, p.estoque, p.categoria_id,
            c.nome AS categoria_nome
     FROM produto p
     LEFT JOIN categoria c ON c.id = p.categoria_id
     ORDER BY p.id`,
  );
  return res.json(rows);
}));

// GET /produtos/:id
app.get('/produtos/:id', asyncRoute(async (req, res) => {
  const id = obterIdValido(req.params.id);
  if (!id) return res.status(400).json({ erro: 'ID inválido.' });

  const [rows] = await pool.execute(
    `SELECT p.id, p.nome, p.preco, p.estoque, p.categoria_id,
            c.nome AS categoria_nome
     FROM produto p
     LEFT JOIN categoria c ON c.id = p.categoria_id
     WHERE p.id = ?`,
    [id],
  );

  if (rows.length === 0) {
    return res.status(404).json({ erro: 'Produto não encontrado.' });
  }
  return res.json(rows[0]);
}));

// POST /produtos
app.post('/produtos', asyncRoute(async (req, res) => {
  const validacao = validarProduto(req.body ?? {});
  if (validacao.erro) return res.status(400).json({ erro: validacao.erro });

  const { nome, preco, estoque, categoria_id } = validacao.dados;
  const [result] = await pool.execute(
    'INSERT INTO produto (nome, preco, estoque, categoria_id) VALUES (?, ?, ?, ?)',
    [nome, preco, estoque, categoria_id],
  );

  return res.status(201).json({
    id: result.insertId,
    nome,
    preco,
    estoque,
    categoria_id,
  });
}));

// PUT /produtos/:id
app.put('/produtos/:id', asyncRoute(async (req, res) => {
  const id = obterIdValido(req.params.id);
  if (!id) return res.status(400).json({ erro: 'ID inválido.' });

  const validacao = validarProduto(req.body ?? {});
  if (validacao.erro) return res.status(400).json({ erro: validacao.erro });

  const { nome, preco, estoque, categoria_id } = validacao.dados;
  const [result] = await pool.execute(
    `UPDATE produto
     SET nome = ?, preco = ?, estoque = ?, categoria_id = ?
     WHERE id = ?`,
    [nome, preco, estoque, categoria_id, id],
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ erro: 'Produto não encontrado.' });
  }
  return res.json({ mensagem: 'Produto atualizado com sucesso.' });
}));

// DELETE /produtos/:id
app.delete('/produtos/:id', asyncRoute(async (req, res) => {
  const id = obterIdValido(req.params.id);
  if (!id) return res.status(400).json({ erro: 'ID inválido.' });

  const [result] = await pool.execute(
    'DELETE FROM produto WHERE id = ?',
    [id],
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ erro: 'Produto não encontrado.' });
  }
  return res.status(204).end();
}));

// GET /categorias
app.get('/categorias', asyncRoute(async (_req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, nome FROM categoria ORDER BY nome',
  );
  return res.json(rows);
}));

// POST /categorias
app.post('/categorias', asyncRoute(async (req, res) => {
  const nome = String((req.body ?? {}).nome ?? '').trim();
  if (!nome || nome.length > 80) {
    return res.status(400).json({ erro: 'Informe um nome de categoria com até 80 caracteres.' });
  }

  const [result] = await pool.execute(
    'INSERT INTO categoria (nome) VALUES (?)',
    [nome],
  );

  return res.status(201).json({ id: result.insertId, nome });
}));

// Padroniza a resposta para rotas que não existem.
app.use((_req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

// Registra detalhes no servidor sem expor informações internas ao navegador.
app.use((err, _req, res, _next) => {
  console.error('[ERRO]', err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'O corpo da requisição contém JSON inválido.' });
  }
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ erro: 'Ja existe uma categoria com esse nome.' });
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ erro: 'A categoria informada nao existe.' });
  }
  if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
    return res.status(400).json({ erro: 'Os dados informados violam uma regra do banco.' });
  }

  return res.status(500).json({ erro: 'Erro interno do servidor.' });
});

async function iniciarServidor() {
  try {
    await pool.execute('SELECT 1');
    const server = app.listen(PORT, () => {
      console.log(`Web2 Loja em http://localhost:${PORT}`);
      console.log('Conexao com MySQL estabelecida.');
    });

    const encerrar = async () => {
      console.log('\nEncerrando servidor...');
      server.close(async () => {
        await pool.end();
        process.exit(0);
      });
    };

    process.once('SIGINT', encerrar);
    process.once('SIGTERM', encerrar);
  } catch (err) {
    console.error('Não foi possível conectar ao MySQL.');
    console.error('Codigo:', err.code || 'sem codigo');
    console.error('Mensagem:', err.message);
    await pool.end();
    process.exitCode = 1;
  }
}

iniciarServidor();
