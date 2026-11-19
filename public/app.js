// Referências aos elementos da interface utilizados pelas funções e eventos.
const mensagem = document.querySelector('#mensagem');
const produtosTabela = document.querySelector('#produtosTabela');
const contador = document.querySelector('#contador');
const buscaForm = document.querySelector('#buscaForm');
const buscaInput = document.querySelector('#busca');
const limparBusca = document.querySelector('#limparBusca');
const produtoForm = document.querySelector('#produtoForm');
const tituloFormProduto = document.querySelector('#tituloFormProduto');
const salvarProduto = document.querySelector('#salvarProduto');
const cancelarEdicao = document.querySelector('#cancelarEdicao');
const categoriaSelect = document.querySelector('#categoria_id');
const categoriaForm = document.querySelector('#categoriaForm');
const listaCategorias = document.querySelector('#listaCategorias');

// Mantém o identificador do produto enquanto o formulário está em modo de edição.
let idEmEdicao = null;
let temporizadorMensagem;

// Centraliza as chamadas à API e transforma respostas HTTP malsucedidas em erros.
async function requisição(url, opcoes = {}) {
  const resposta = await fetch(url, opcoes);
  if (resposta.status === 204) return null;

  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(dados.erro || `Falha na requisição (${resposta.status}).`);
  }
  return dados;
}

// Exibe feedback acessível e remove a mensagem após alguns segundos.
function mostrarMensagem(texto, tipo = 'success') {
  clearTimeout(temporizadorMensagem);
  mensagem.textContent = texto;
  mensagem.className = `message message--${tipo}`;
  mensagem.hidden = false;
  temporizadorMensagem = setTimeout(() => {
    mensagem.hidden = true;
  }, 5000);
}

// Padroniza a apresentação dos valores no formato monetário brasileiro.
function formatarPreco(valor) {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

// Cria células usando textContent para não interpretar dados como HTML.
function criarCelula(texto, classe = '') {
  const celula = document.createElement('td');
  if (classe) celula.className = classe;
  celula.textContent = texto;
  return celula;
}

// Consulta a API e atualiza a tabela conforme o termo de busca informado.
async function carregarProdutos(termo = '') {
  produtosTabela.replaceChildren();
  const linhaCarregando = document.createElement('tr');
  const celulaCarregando = criarCelula('Carregando produtos...', 'empty');
  celulaCarregando.colSpan = 5;
  linhaCarregando.append(celulaCarregando);
  produtosTabela.append(linhaCarregando);

  const query = termo ? `?busca=${encodeURIComponent(termo)}` : '';
  try {
    const produtos = await requisição(`/produtos${query}`);
    produtosTabela.replaceChildren();
    contador.textContent = `${produtos.length} ${produtos.length === 1 ? 'produto' : 'produtos'}`;

    if (produtos.length === 0) {
      const linha = document.createElement('tr');
      const celula = criarCelula('Nenhum produto encontrado.', 'empty');
      celula.colSpan = 5;
      linha.append(celula);
      produtosTabela.append(linha);
      return;
    }

    for (const produto of produtos) {
      const linha = document.createElement('tr');
      linha.append(criarCelula(produto.nome, 'product-name'));

      const categoria = criarCelula(produto.categoria_nome || 'Sem categoria');
      if (produto.categoria_nome) {
        const etiqueta = document.createElement('span');
        etiqueta.className = 'category-tag';
        etiqueta.textContent = produto.categoria_nome;
        categoria.replaceChildren(etiqueta);
      }
      linha.append(categoria);
      linha.append(criarCelula(formatarPreco(produto.preco), 'price'));
      linha.append(criarCelula(String(produto.estoque), 'stock'));

      const acoes = document.createElement('td');
      acoes.className = 'actions-column';
      const grupo = document.createElement('div');
      grupo.className = 'row-actions';

      const editar = document.createElement('button');
      editar.type = 'button';
      editar.className = 'button button--secondary button--small';
      editar.textContent = 'Editar';
      editar.dataset.action = 'editar';
      editar.dataset.id = String(produto.id);
      editar.setAttribute('aria-label', `Editar ${produto.nome}`);

      const excluir = document.createElement('button');
      excluir.type = 'button';
      excluir.className = 'button button--danger button--small';
      excluir.textContent = 'Excluir';
      excluir.dataset.action = 'excluir';
      excluir.dataset.id = String(produto.id);
      excluir.setAttribute('aria-label', `Excluir ${produto.nome}`);

      grupo.append(editar, excluir);
      acoes.append(grupo);
      linha.append(acoes);
      produtosTabela.append(linha);
    }
  } catch (erro) {
    contador.textContent = 'Indisponível';
    produtosTabela.replaceChildren();
    const linha = document.createElement('tr');
    const celula = criarCelula(erro.message, 'empty');
    celula.colSpan = 5;
    linha.append(celula);
    produtosTabela.append(linha);
    mostrarMensagem(erro.message, 'error');
  }
}

// Carrega as categorias no seletor do produto e na lista de apoio.
async function carregarCategorias() {
  try {
    const categorias = await requisição('/categorias');
    categoriaSelect.replaceChildren();

    const opcaoVazia = document.createElement('option');
    opcaoVazia.value = '';
    opcaoVazia.textContent = 'Sem categoria';
    categoriaSelect.append(opcaoVazia);

    listaCategorias.replaceChildren();
    if (categorias.length === 0) {
      const item = document.createElement('li');
      item.className = 'empty';
      item.textContent = 'Nenhuma categoria cadastrada.';
      listaCategorias.append(item);
      return;
    }

    for (const categoria of categorias) {
      const opcao = document.createElement('option');
      opcao.value = String(categoria.id);
      opcao.textContent = categoria.nome;
      categoriaSelect.append(opcao);

      const item = document.createElement('li');
      item.textContent = categoria.nome;
      listaCategorias.append(item);
    }
  } catch (erro) {
    mostrarMensagem(erro.message, 'error');
  }
}

// Retorna o formulário ao estado inicial e encerra qualquer edição em andamento.
function limparFormularioProduto() {
  produtoForm.reset();
  document.querySelector('#estoque').value = '0';
  idEmEdicao = null;
  tituloFormProduto.textContent = 'Novo produto';
  salvarProduto.textContent = 'Salvar produto';
  cancelarEdicao.hidden = true;
}

// Busca os dados completos do produto e os apresenta no formulário.
async function iniciarEdicao(id) {
  try {
    const produto = await requisição(`/produtos/${id}`);
    idEmEdicao = produto.id;
    document.querySelector('#nome').value = produto.nome;
    document.querySelector('#preco').value = Number(produto.preco).toFixed(2);
    document.querySelector('#estoque').value = produto.estoque;
    categoriaSelect.value = produto.categoria_id == null ? '' : String(produto.categoria_id);
    tituloFormProduto.textContent = `Editar produto #${produto.id}`;
    salvarProduto.textContent = 'Salvar alterações';
    cancelarEdicao.hidden = false;
    document.querySelector('#nome').focus();
    produtoForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (erro) {
    mostrarMensagem(erro.message, 'error');
  }
}

// Eventos de busca e limpeza do filtro.
buscaForm.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  await carregarProdutos(buscaInput.value.trim());
});

limparBusca.addEventListener('click', async () => {
  buscaInput.value = '';
  await carregarProdutos();
});

// Envia inclusão (POST) ou alteração (PUT), conforme o estado do formulário.
produtoForm.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const dados = Object.fromEntries(new FormData(produtoForm));
  dados.preco = String(dados.preco).replace(',', '.');
  dados.estoque = Number(dados.estoque);
  dados.categoria_id = dados.categoria_id === '' ? null : Number(dados.categoria_id);

  const editando = idEmEdicao !== null;
  const url = editando ? `/produtos/${idEmEdicao}` : '/produtos';
  const metodo = editando ? 'PUT' : 'POST';

  salvarProduto.disabled = true;
  try {
    await requisição(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    mostrarMensagem(editando ? 'Produto atualizado com sucesso.' : 'Produto cadastrado com sucesso.');
    limparFormularioProduto();
    await carregarProdutos(buscaInput.value.trim());
  } catch (erro) {
    mostrarMensagem(erro.message, 'error');
  } finally {
    salvarProduto.disabled = false;
  }
});

cancelarEdicao.addEventListener('click', limparFormularioProduto);

// Delegação de eventos: os botões são recriados sempre que a tabela é atualizada.
produtosTabela.addEventListener('click', async (evento) => {
  const botao = evento.target.closest('button[data-action]');
  if (!botao) return;
  const id = Number(botao.dataset.id);

  if (botao.dataset.action === 'editar') {
    await iniciarEdicao(id);
    return;
  }

  if (botao.dataset.action === 'excluir') {
    const confirmado = window.confirm(`Tem certeza de que deseja excluir o produto #${id}?`);
    if (!confirmado) return;

    botao.disabled = true;
    try {
      await requisição(`/produtos/${id}`, { method: 'DELETE' });
      mostrarMensagem('Produto excluído com sucesso.');
      if (idEmEdicao === id) limparFormularioProduto();
      await carregarProdutos(buscaInput.value.trim());
    } catch (erro) {
      mostrarMensagem(erro.message, 'error');
      botao.disabled = false;
    }
  }
});

// Cadastra uma categoria e atualiza o seletor de produtos.
categoriaForm.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const dados = Object.fromEntries(new FormData(categoriaForm));
  const botao = categoriaForm.querySelector('button[type="submit"]');
  botao.disabled = true;

  try {
    await requisição('/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    categoriaForm.reset();
    await carregarCategorias();
    mostrarMensagem('Categoria cadastrada com sucesso.');
  } catch (erro) {
    mostrarMensagem(erro.message, 'error');
  } finally {
    botao.disabled = false;
  }
});

Promise.all([carregarCategorias(), carregarProdutos()]);
