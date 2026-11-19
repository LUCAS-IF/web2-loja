# Projeto Loja - Desenvolvimento Web 2

Esse projeto foi feito para a atividade da disciplina Desenvolvimento Web 2. A ideia é ter uma pequena aplicação de loja em que seja possível consultar, cadastrar, editar e excluir produtos. Também dá para cadastrar categorias e relacioná-las aos produtos.

Usei HTML, CSS e JavaScript na parte da página. No servidor, usei Node.js com Express, e os dados ficam armazenados no MySQL.

## O que é necessário

Para executar o projeto, é preciso ter instalado:

- Node.js e npm;
- MySQL Server 8;
- MySQL Workbench.

O VS Code pode ser usado para abrir e editar os arquivos.

## Preparando o banco de dados

1. Abra o MySQL Workbench e conecte-se ao servidor local usando o usuário `root`.
2. Abra o arquivo `sql/web2_loja.sql`.
3. Execute o script e atualize a lista de schemas. Deve aparecer o banco `web2_loja`, com as tabelas `produto` e `categoria`.
4. Ainda no Workbench, abra uma nova aba SQL e crie o usuário que será usado pela aplicação. Troque `SENHA_FORTE_AQUI` por uma senha sua e use a mesma nas duas linhas:

```sql
CREATE USER IF NOT EXISTS 'app_web2'@'localhost'
  IDENTIFIED BY 'SENHA_FORTE_AQUI';

ALTER USER 'app_web2'@'localhost'
  IDENTIFIED BY 'SENHA_FORTE_AQUI';

GRANT SELECT, INSERT, UPDATE, DELETE
  ON web2_loja.*
  TO 'app_web2'@'localhost';
```

A aplicação usa o usuário `app_web2`, e não o `root`. Não coloque a senha real no arquivo SQL nem publique essa senha no GitHub.

## Configurando e iniciando o projeto

Abra a pasta do projeto no VS Code. No terminal, execute:

```powershell
npm.cmd install
```

Depois, crie o arquivo `.env` a partir do modelo `.env.example`:

```powershell
Copy-Item .env.example .env
```

Abra o `.env` e coloque a senha que você definiu para o usuário `app_web2` em `DB_PASSWORD`. As outras configurações já vêm preenchidas no modelo. O arquivo `.env` é local e não deve ser enviado ao GitHub.

Para iniciar o servidor, use:

```powershell
npm.cmd start
```

Quando aparecer a mensagem de que o servidor está em `http://localhost:3000` e que a conexão com o MySQL foi estabelecida, abra esse endereço no navegador. Para encerrar, volte ao terminal e pressione `Ctrl + C`.

## O que a aplicação permite fazer

- Ver os produtos cadastrados em uma tabela.
- Pesquisar produtos pelo nome.
- Cadastrar, editar e excluir produtos.
- Cadastrar e consultar categorias.
- Escolher uma categoria ao cadastrar ou editar um produto.
- Ver os preços no formato brasileiro, em reais.

## Rotas da API

| Método | Rota | O que faz |
|---|---|---|
| GET | `/produtos` | Lista os produtos. |
| GET | `/produtos?busca=tec` | Pesquisa produtos pelo nome. |
| GET | `/produtos/:id` | Consulta um produto pelo ID. |
| POST | `/produtos` | Cadastra um produto. |
| PUT | `/produtos/:id` | Atualiza um produto. |
| DELETE | `/produtos/:id` | Exclui um produto. |
| GET | `/categorias` | Lista as categorias. |
| POST | `/categorias` | Cadastra uma categoria. |

## Sobre a busca e a segurança

Na busca de produtos, usei `LIKE` para encontrar nomes que contenham o texto digitado. Por exemplo, ao pesquisar `tec`, o sistema encontra o produto “Teclado USB”.

Também usei parâmetros (`?`) nas consultas ao banco, em vez de juntar diretamente o texto digitado pelo usuário ao comando SQL. Isso é importante porque a concatenação pode permitir uma **SQL Injection**: alguém poderia digitar um texto preparado para mudar a consulta e acessar informações que não deveria.

Um exemplo de consulta parametrizada usada no projeto é:

```js
const termo = `%${busca}%`;
const [rows] = await pool.execute(
  'SELECT id, nome FROM produto WHERE nome LIKE ?',
  [termo]
);
```

Assim, o texto da pesquisa é tratado como um valor da consulta, e não como parte do comando SQL.

## Antes de enviar

O projeto deve ser enviado sem a pasta `node_modules` e sem o arquivo `.env`, pois eles não precisam fazer parte da entrega e o `.env` contém a senha do banco. O arquivo `.env.example` deve continuar no projeto para mostrar quais configurações são necessárias.

Antes de publicar no GitHub, confira se `.env` e `node_modules` não aparecem entre os arquivos que serão enviados. O código, o script SQL, o README e os arquivos de configuração podem ser incluídos normalmente.
