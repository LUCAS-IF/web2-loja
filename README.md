# Web2 Loja — CRUD com MySQL e Node.js

Atividade pratica da disciplina Desenvolvimento Web 2. Projeto acadêmico que integra uma interface HTML/CSS/JavaScript a uma API REST com Node.js, Express, mysql2 e MySQL.

## 1. Requisitos

- MySQL Server 8 em execucao.
- MySQL Workbench.
- Node.js e npm instalados.
- Visual Studio Code (recomendado).

## 2. Banco de dados

1. Abra o MySQL Workbench e conecte-se a instancia local como `root`.
2. Abra `sql/web2_loja.sql` em **File > Open SQL Script**.
3. Execute o script com o botao do raio (ou Ctrl+Shift+Enter).
4. Atualize o painel **Schemas** e confira `web2_loja`, `categoria` e `produto`.
5. Confira os quatro produtos iniciais no resultado dos `SELECT` ao final do script.
6. Em uma nova aba SQL do Workbench, ainda conectado como `root`, execute o comando abaixo. Troque `SENHA_FORTE_AQUI` por uma senha forte escolhida por voce e use exatamente a mesma nas duas linhas:

```sql
CREATE USER IF NOT EXISTS 'app_web2'@'localhost'
  IDENTIFIED BY 'SENHA_FORTE_AQUI';

ALTER USER 'app_web2'@'localhost'
  IDENTIFIED BY 'SENHA_FORTE_AQUI';

GRANT SELECT, INSERT, UPDATE, DELETE
  ON web2_loja.*
  TO 'app_web2'@'localhost';

SHOW GRANTS FOR 'app_web2'@'localhost';
```

Execute esse comando diretamente na aba de consulta; **nao salve a senha real em um arquivo SQL nem no GitHub**. O resultado de `SHOW GRANTS` deve mostrar apenas `SELECT`, `INSERT`, `UPDATE` e `DELETE` em `web2_loja.*`. A aplicacao nao precisa de permissao para criar ou apagar tabelas.

O material do professor informa que `produto` possui `id`, `nome`, `preco`, `estoque` e uma chave estrangeira `categoria_id`. Como o PDF nao detalha as colunas da tabela `categoria`, este projeto adota `categoria(id, nome)` e a relacao `produto.categoria_id -> categoria.id`.

## 3. Configurar o Node.js

Abra a pasta do projeto no VS Code. No terminal integrado (**Terminal > New Terminal**), confirme que está na pasta que contém `package.json` e execute:

```powershell
npm.cmd install
```

Crie o arquivo local `.env` copiando `.env.example`. No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Abra `.env` e preencha `DB_PASSWORD` com a mesma senha que voce definiu no comando `CREATE USER` executado diretamente no Workbench. Nao coloque a senha do root nesse arquivo e nunca envie `.env` ao GitHub.

## 4. Executar

No terminal do VS Code:

```powershell
npm.cmd start
```

A mensagem esperada e semelhante a:

```text
Web2 Loja em http://localhost:3000
Conexao com MySQL estabelecida.
```

Abra `http://localhost:3000` no navegador. Para parar o servidor, volte ao terminal e pressione `Ctrl+C`.

Durante o desenvolvimento, pode-se usar `npm.cmd run dev` para reiniciar o servidor quando arquivos do Node.js forem alterados.

## 5. Funcionalidades da interface

- Listagem de produtos em tabela.
- Busca pelo nome do produto.
- Cadastro, edicao e exclusao de produtos.
- Preco formatado com `toLocaleString('pt-BR')` e moeda BRL.
- Listagem e cadastro de categorias.
- Associacao opcional do produto a uma categoria.
- Confirmacao antes da exclusao.

## 6. Boas práticas de interface e IHC

- Hierarquia visual com título principal, seções identificadas e conteúdo agrupado por tarefa.
- Rótulos visíveis associados aos campos; os campos obrigatórios usam validação nativa do navegador.
- Feedback de sucesso e erro em uma região `aria-live`, sem depender apenas de cor.
- Foco visível e link para pular diretamente ao conteúdo principal, facilitando o uso por teclado.
- Tabela semântica com legenda, cabeçalhos identificados e rolagem horizontal em telas estreitas.
- Layout responsivo para computador, tablet e celular, com botões e campos de tamanho adequado.
- Preferência do sistema por redução de movimento respeitada.
- Textos do banco são inseridos com `textContent`, sem interpretar conteúdo externo como HTML.

## 7. Rotas da API

| Metodo | Rota | Funcao | Resposta esperada |
|---|---|---|---|
| GET | `/produtos` | Listar produtos | 200 |
| GET | `/produtos?busca=tec` | Buscar produtos por nome | 200 |
| GET | `/produtos/:id` | Consultar um produto | 200 ou 404 |
| POST | `/produtos` | Cadastrar produto | 201 |
| PUT | `/produtos/:id` | Atualizar produto | 200 ou 404 |
| DELETE | `/produtos/:id` | Excluir produto | 204 ou 404 |
| GET | `/categorias` | Listar categorias | 200 |
| POST | `/categorias` | Cadastrar categoria | 201 |

### Exemplos de teste no PowerShell

Listar produtos:

```powershell
Invoke-RestMethod http://localhost:3000/produtos
```

Busca solicitada no desafio:

```powershell
Invoke-RestMethod "http://localhost:3000/produtos?busca=tec"
```

Listar categorias:

```powershell
Invoke-RestMethod http://localhost:3000/categorias
```

Cadastrar categoria:

```powershell
$corpo = @{ nome = 'Informatica' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:3000/categorias -ContentType 'application/json' -Body $corpo
```

Cadastrar produto:

```powershell
$corpo = @{ nome = 'Monitor 24'; preco = 799.90; estoque = 5; categoria_id = 1 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:3000/produtos -ContentType 'application/json' -Body $corpo
```

Para testar exclusao, substitua `1` pelo ID de um registro de teste:

```powershell
Invoke-RestMethod -Method Delete -Uri http://localhost:3000/produtos/1
```

## 8. Por que nao concatenar a busca no SQL?

Nao se deve montar SQL inserindo diretamente texto digitado pelo usuario. Uma entrada como `x' OR '1'='1` pode alterar a estrutura da consulta e fazer com que ela retorne registros que nao deveriam ser retornados. Isso e SQL Injection.

A aplicacao utiliza placeholder:

```js
const termo = `%${busca}%`;
const [rows] = await pool.execute(
  'SELECT id, nome FROM produto WHERE nome LIKE ?',
  [termo]
);
```

O comando SQL e enviado separadamente dos valores. O texto informado pelo usuario e tratado como dado, e nao como parte da instrucao SQL. Nao substitua o placeholder por concatenacao da entrada na string SQL.

## 9. Checklist de testes antes da entrega

- [ ] O Workbench mostra o schema `web2_loja`.
- [ ] As tabelas `produto` e `categoria` existem.
- [ ] O usuario `app_web2` conecta e consegue consultar os dados.
- [ ] O usuario `app_web2` nao consegue executar `DROP TABLE`.
- [ ] `npm.cmd start` inicia sem erro de conexao.
- [ ] `http://localhost:3000` abre a interface.
- [ ] A tabela mostra os quatro produtos iniciais.
- [ ] O preco aparece em formato brasileiro (por exemplo, `R$ 89,90`).
- [ ] A busca por `tec` retorna Teclado USB.
- [ ] E possivel cadastrar uma categoria.
- [ ] E possivel cadastrar um produto e ele aparece na tabela.
- [ ] E possivel editar um produto.
- [ ] O botao Excluir pede confirmacao e remove o produto ao confirmar.
- [ ] Cancelar a confirmacao mantem o produto.
- [ ] Buscar um ID inexistente retorna 404.
- [ ] Entradas invalidas (preco negativo, estoque negativo ou nome vazio) sao rejeitadas.

## 10. Preparar a entrega e publicar no GitHub

Antes de enviar:

1. Pare o servidor com `Ctrl+C`.
2. Confirme que `.env` esta listado em `.gitignore` e que `node_modules/` tambem esta ignorado.
3. Nao compacte nem envie `node_modules` ou `.env`.
4. Mantenha `.env.example` no projeto: ele mostra os nomes das variaveis sem revelar senhas.
5. Envie o codigo-fonte, `sql/web2_loja.sql`, `README.md`, `.gitignore`, `.gitattributes` e `package.json`/`package-lock.json` ao GitHub.
6. No GitHub, confirme que `.env` e `node_modules` nao aparecem no repositorio.
7. Envie ao professor o link do repositorio ou um ZIP sem `.env` e sem `node_modules`, conforme o canal informado em aula. O PDF informa envio por e-mail até 23/11/2026 às 23h55.

Comandos Git (execute dentro da pasta do projeto, depois de criar um repositorio vazio no GitHub e copiar a URL dele):

```powershell
git init
git add .
git status
git commit -m "feat: implementa CRUD com MySQL e Node.js"
git branch -M main
git remote add origin URL_DO_SEU_REPOSITORIO
git push -u origin main
```

Antes do `git commit`, leia a saida de `git status`: o arquivo `.env` e a pasta `node_modules` nao podem aparecer entre os arquivos a serem enviados.

## 11. Seguranca

- Nunca use `root` nas configuracoes da aplicacao.
- Nunca publique `.env`, senhas ou credenciais.
- Use placeholders (`?`) em consultas que recebem valores externos.
- O front-end usa `textContent` para exibir texto vindo do banco, evitando interpretar esse conteudo como HTML.
- As mensagens enviadas ao navegador nao expoem detalhes internos do MySQL; detalhes tecnicos ficam no terminal do servidor.


## 12. Comentários no código

Os comentários foram mantidos nas partes em que explicam decisões, etapas ou responsabilidades. Não é necessário comentar cada linha: nomes claros de funções e variáveis, indentação consistente e separação por responsabilidade tornam o código mais fácil de manter.
