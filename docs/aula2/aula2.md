# Aula 2 — APIs HTTP, rotas e introdução ao service

## Objetivo da aula

Evoluir o backend iniciado na Aula 1 para uma API de prestações de contas com operações de cadastro, listagem, consulta, substituição, alteração de status e exclusão.

Durante a construção, vamos usar os métodos HTTP `GET`, `POST`, `PUT`, `PATCH` e `DELETE`, receber dados por path parameter, query parameter e body, aplicar códigos de resposta HTTP e separar as responsabilidades entre routes, controllers e services.

## Resultado final

Ao concluir a aula, o backend terá as seguintes rotas:

| Método | Rota | Operação |
| --- | --- | --- |
| `GET` | `/prestacoes-de-contas` | listar as prestações |
| `GET` | `/prestacoes-de-contas/consulta?termo=...` | demonstrar o recebimento de um query parameter |
| `GET` | `/prestacoes-de-contas/:id` | buscar uma prestação pelo identificador |
| `POST` | `/prestacoes-de-contas` | cadastrar uma prestação |
| `PUT` | `/prestacoes-de-contas/:id` | substituir os dados editáveis |
| `PATCH` | `/prestacoes-de-contas/:id/status` | alterar somente o status |
| `DELETE` | `/prestacoes-de-contas/:id` | excluir uma prestação |

Os registros serão mantidos em um array enquanto o servidor estiver em execução. A aplicação ficará organizada neste fluxo:

```text
requisição HTTP → route → controller → service → array em memória
```

## Contexto

Na Aula 1, criamos o servidor Express, registramos rotas e usamos controllers para receber dados. O `POST` mostrava o body no terminal, mas a informação enviada não podia ser consultada, alterada ou excluída.

Uma API de prestação de contas precisa representar operações completas. Depois de cadastrar uma despesa, o usuário deve conseguir consultar o registro, corrigir seus dados, atualizar seu status e, quando necessário, excluí-lo.

Para construir essas operações sem concentrar tudo no controller, vamos introduzir o service. O controller continuará cuidando da comunicação HTTP, enquanto o service manipulará as prestações mantidas em memória.

## Explicação conceitual

### Recurso, rota e endpoint

O recurso principal desta API é a prestação de contas. Por isso, usamos o substantivo no plural na URL:

```text
/prestacoes-de-contas
```

Um endpoint é formado pela combinação de um método HTTP com uma rota. `GET /prestacoes-de-contas` e `POST /prestacoes-de-contas` usam o mesmo caminho, mas representam operações diferentes.

### Métodos HTTP

| Método | Uso nesta API |
| --- | --- |
| `GET` | consultar dados sem alterá-los |
| `POST` | criar uma nova prestação |
| `PUT` | substituir todos os dados editáveis de uma prestação |
| `PATCH` | alterar somente uma parte do recurso |
| `DELETE` | excluir uma prestação |

O `PUT` desta aula recebe empresa, descrição, valor e data de vencimento. O `PATCH` recebe apenas o novo status. Essa diferença deixa claro se a requisição representa uma substituição completa ou uma alteração pontual.

### Path parameter, query parameter e body

Os dados de uma requisição podem chegar em locais diferentes:

| Local | Exemplo | Leitura no Express |
| --- | --- | --- |
| path parameter | `/prestacoes-de-contas/1` | `requisicao.params.id` |
| query parameter | `/prestacoes-de-contas/consulta?termo=viagem` | `requisicao.query.termo` |
| body | JSON enviado em um `POST` | `requisicao.body` |

O path parameter faz parte do caminho e identifica um recurso específico. O query parameter aparece depois de `?` e acrescenta uma informação à consulta. Nesta aula, a rota de consulta apenas devolverá o termo recebido para tornar visível o funcionamento de `requisicao.query`; ela não filtrará a listagem.

O body transporta os dados do cadastro ou da atualização. Para que o Express converta o JSON recebido em um objeto, `express.json()` deve ser registrado antes das rotas.

### Códigos de resposta HTTP

O status informa o resultado da requisição sem exigir que o cliente interprete uma mensagem textual.

| Status | Significado nesta aula |
| --- | --- |
| `200 OK` | consulta ou alteração concluída |
| `201 Created` | prestação cadastrada |
| `204 No Content` | prestação excluída, sem body na resposta |
| `404 Not Found` | identificador não encontrado |

### Routes, controllers e services

Cada camada responde a uma pergunta diferente:

| Camada | Responsabilidade |
| --- | --- |
| route | qual método e caminho acionam a operação? |
| controller | quais dados chegaram pela requisição e qual resposta HTTP deve sair? |
| service | como consultar ou modificar as prestações? |

Essa separação evita que detalhes do Express se misturem com a manipulação do array. O service não recebe `Request` nem `Response`; ele trabalha com números, textos e objetos do domínio.

## Preparação

Continue no projeto `backend` criado na Aula 1:

```bash
cd /caminho/para/o/projeto/backend
```

As dependências necessárias já foram instaladas. Confirme que o projeto compila antes de alterar os arquivos:

```bash
npm run build
```

Nesta aula, criaremos as pastas `services` e `tipos`, separaremos a configuração da aplicação em `app.ts` e substituiremos o router geral pelas rotas do recurso de prestações de contas.

## Passo a passo

### 1. Organizar a estrutura do backend

Ao final da reorganização, os arquivos usados pela aplicação serão:

```text
backend/
├── src/
│   ├── controllers/
│   │   └── prestacaoContaController.ts
│   ├── routes/
│   │   └── prestacaoContaRotas.ts
│   ├── services/
│   │   └── prestacaoContaService.ts
│   ├── tipos/
│   │   └── prestacaoConta.ts
│   ├── app.ts
│   └── servidor.ts
├── package.json
└── tsconfig.json
```

No Linux ou macOS, crie as novas pastas e os arquivos:

```bash
mkdir -p src/controllers src/routes src/services src/tipos
touch src/app.ts
touch src/controllers/prestacaoContaController.ts
touch src/routes/prestacaoContaRotas.ts
touch src/services/prestacaoContaService.ts
touch src/tipos/prestacaoConta.ts
```

No Windows PowerShell, use:

```powershell
New-Item src/services, src/tipos -ItemType Directory -Force
New-Item src/app.ts -ItemType File -Force
New-Item src/controllers/prestacaoContaController.ts -ItemType File -Force
New-Item src/routes/prestacaoContaRotas.ts -ItemType File -Force
New-Item src/services/prestacaoContaService.ts -ItemType File -Force
New-Item src/tipos/prestacaoConta.ts -ItemType File -Force
```

Os arquivos `helloController.ts`, `usariosController.ts`, `prestacaoContasController.ts` e `routes/router.ts` foram usados para os primeiros exemplos da Aula 1 e não fazem parte da nova estrutura. Exclua esses quatro arquivos pelo explorador do editor depois de criar os arquivos acima. O novo tipo substitui os campos introdutórios `nomeGasto`, `data` e `arquivo` por `empresa`, `descricao` e `dataVencimento`, que representam o contrato adotado para a prestação de contas. Dessa forma, o projeto fica com uma única API e sem imports ou rotas antigas.

### 2. Definir os tipos da prestação de contas

Crie `src/tipos/prestacaoConta.ts`:

```ts
export type StatusPrestacao = 'PENDENTE' | 'RECEBIDA' | 'CANCELADA';

export interface DadosPrestacaoConta {
  empresa: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
}

export interface PrestacaoConta extends DadosPrestacaoConta {
  id: number;
  status: StatusPrestacao;
}

export interface CorpoStatusPrestacao {
  status: StatusPrestacao;
}

export interface ParametrosId {
  id: string;
}
```

`DadosPrestacaoConta` descreve os campos enviados no cadastro e na substituição. `PrestacaoConta` acrescenta `id` e `status`, que são controlados pela aplicação.

O status aceita três valores: `PENDENTE`, `RECEBIDA` ou `CANCELADA`. Uma nova prestação começa como `PENDENTE`.

**Checkpoint:** salve o arquivo e execute:

```bash
npm run build
```

Como o arquivo ainda não é importado, a compilação apenas confirma que a sintaxe e os tipos estão corretos.

### 3. Criar o service com dados em memória

Crie `src/services/prestacaoContaService.ts`:

```ts
import {
  DadosPrestacaoConta,
  PrestacaoConta,
  StatusPrestacao,
} from '../tipos/prestacaoConta';

const prestacoes: PrestacaoConta[] = [];
let proximoId = 1;

export function listarPrestacoes(): PrestacaoConta[] {
  return prestacoes;
}

export function buscarPrestacaoPorId(id: number): PrestacaoConta | undefined {
  return prestacoes.find((prestacao) => prestacao.id === id);
}

export function criarPrestacao(dados: DadosPrestacaoConta): PrestacaoConta {
  const novaPrestacao: PrestacaoConta = {
    id: proximoId,
    ...dados,
    status: 'PENDENTE',
  };

  proximoId += 1;
  prestacoes.push(novaPrestacao);
  return novaPrestacao;
}

export function substituirPrestacao(
  id: number,
  dados: DadosPrestacaoConta,
): PrestacaoConta | undefined {
  const prestacao = buscarPrestacaoPorId(id);

  if (!prestacao) {
    return undefined;
  }

  prestacao.empresa = dados.empresa;
  prestacao.descricao = dados.descricao;
  prestacao.valor = dados.valor;
  prestacao.dataVencimento = dados.dataVencimento;

  return prestacao;
}

export function alterarStatusPrestacao(
  id: number,
  status: StatusPrestacao,
): PrestacaoConta | undefined {
  const prestacao = buscarPrestacaoPorId(id);

  if (!prestacao) {
    return undefined;
  }

  prestacao.status = status;
  return prestacao;
}

export function excluirPrestacao(id: number): boolean {
  const indice = prestacoes.findIndex((prestacao) => prestacao.id === id);

  if (indice === -1) {
    return false;
  }

  prestacoes.splice(indice, 1);
  return true;
}
```

O array `prestacoes` representa os dados da aplicação durante a execução. `proximoId` gera identificadores numéricos sem exigir que o cliente envie um `id`.

As funções de busca, substituição e alteração podem devolver `undefined`. Esse retorno informa ao controller que não existe uma prestação com o identificador recebido. Na exclusão, `true` ou `false` comunica se um item foi removido.

Como o array está na memória do processo Node.js, reiniciar o servidor faz a sequência começar novamente com um array vazio e `proximoId` igual a `1`.

**Checkpoint:** compile novamente:

```bash
npm run build
```

### 4. Criar os controllers de listagem e consulta

Comece `src/controllers/prestacaoContaController.ts` com os imports e as três funções de consulta:

```ts
import { Request, Response } from 'express';
import {
  alterarStatusPrestacao,
  buscarPrestacaoPorId,
  criarPrestacao,
  excluirPrestacao,
  listarPrestacoes,
  substituirPrestacao,
} from '../services/prestacaoContaService';
import {
  CorpoStatusPrestacao,
  DadosPrestacaoConta,
  ParametrosId,
} from '../tipos/prestacaoConta';

export function listar(_requisicao: Request, resposta: Response): void {
  resposta.status(200).json(listarPrestacoes());
}

export function demonstrarConsulta(
  requisicao: Request,
  resposta: Response,
): void {
  resposta.status(200).json({
    termoRecebido: requisicao.query.termo ?? null,
  });
}

export function buscarPorId(
  requisicao: Request<ParametrosId>,
  resposta: Response,
): void {
  const id = Number(requisicao.params.id);
  const prestacao = buscarPrestacaoPorId(id);

  if (!prestacao) {
    resposta
      .status(404)
      .json({ mensagem: 'Prestação de contas não encontrada' });
    return;
  }

  resposta.status(200).json(prestacao);
}
```

`listar` recebe a lista do service e a devolve com `200`. O nome `_requisicao` indica que o parâmetro é exigido pelo Express, mas não é usado nessa função.

`demonstrarConsulta` lê `termo` em `requisicao.query` e devolve o mesmo valor. O operador `??` usa `null` quando o parâmetro não foi enviado.

Em `buscarPorId`, todo path parameter chega como texto. `Number()` converte o valor antes de chamar o service, que trabalha com identificadores numéricos.

### 5. Acrescentar os controllers de criação e alteração

No final de `src/controllers/prestacaoContaController.ts`, acrescente:

```ts
export function criar(
  requisicao: Request<object, object, DadosPrestacaoConta>,
  resposta: Response,
): void {
  const prestacaoCriada = criarPrestacao(requisicao.body);
  resposta.status(201).json(prestacaoCriada);
}

export function substituir(
  requisicao: Request<ParametrosId, object, DadosPrestacaoConta>,
  resposta: Response,
): void {
  const id = Number(requisicao.params.id);
  const prestacaoAtualizada = substituirPrestacao(id, requisicao.body);

  if (!prestacaoAtualizada) {
    resposta
      .status(404)
      .json({ mensagem: 'Prestação de contas não encontrada' });
    return;
  }

  resposta.status(200).json(prestacaoAtualizada);
}

export function alterarStatus(
  requisicao: Request<ParametrosId, object, CorpoStatusPrestacao>,
  resposta: Response,
): void {
  const id = Number(requisicao.params.id);
  const prestacaoAtualizada = alterarStatusPrestacao(
    id,
    requisicao.body.status,
  );

  if (!prestacaoAtualizada) {
    resposta
      .status(404)
      .json({ mensagem: 'Prestação de contas não encontrada' });
    return;
  }

  resposta.status(200).json(prestacaoAtualizada);
}
```

No `POST`, o controller lê o body, chama o service e responde com `201`. O objeto criado já contém o `id` e o status inicial.

No `PUT`, todos os campos de `DadosPrestacaoConta` são enviados para substituir os dados editáveis. O identificador e o status permanecem os mesmos.

No `PATCH`, o body contém somente `status`. O service localiza o registro e altera apenas esse campo.

### 6. Acrescentar o controller de exclusão

Complete `src/controllers/prestacaoContaController.ts` com:

```ts
export function excluir(
  requisicao: Request<ParametrosId>,
  resposta: Response,
): void {
  const id = Number(requisicao.params.id);
  const prestacaoExcluida = excluirPrestacao(id);

  if (!prestacaoExcluida) {
    resposta
      .status(404)
      .json({ mensagem: 'Prestação de contas não encontrada' });
    return;
  }

  resposta.status(204).send();
}
```

Uma exclusão bem-sucedida devolve `204`. Esse status não possui body, por isso usamos `send()` sem conteúdo.

### 7. Associar métodos, caminhos e controllers

Crie `src/routes/prestacaoContaRotas.ts`:

```ts
import { Router } from 'express';
import {
  alterarStatus,
  buscarPorId,
  criar,
  demonstrarConsulta,
  excluir,
  listar,
  substituir,
} from '../controllers/prestacaoContaController';

export const prestacaoContaRotas = Router();

prestacaoContaRotas.get('/', listar);
prestacaoContaRotas.get('/consulta', demonstrarConsulta);
prestacaoContaRotas.get('/:id', buscarPorId);
prestacaoContaRotas.post('/', criar);
prestacaoContaRotas.put('/:id', substituir);
prestacaoContaRotas.patch('/:id/status', alterarStatus);
prestacaoContaRotas.delete('/:id', excluir);
```

A rota `/consulta` aparece antes de `/:id`. O Express verifica as rotas na ordem em que foram registradas. Se `/:id` viesse primeiro, a palavra `consulta` poderia ser interpretada como um identificador.

O arquivo de rotas não manipula o array e não monta respostas. Ele apenas associa cada endpoint ao controller correspondente.

### 8. Configurar a aplicação e o servidor

Crie `src/app.ts`:

```ts
import express from 'express';
import { prestacaoContaRotas } from './routes/prestacaoContaRotas';

export const app = express();

app.use(express.json());
app.use('/prestacoes-de-contas', prestacaoContaRotas);
```

O prefixo registrado em `app.use` é combinado com os caminhos do router. Assim, o caminho `/` do router resulta em `/prestacoes-de-contas`, enquanto `/:id` resulta em `/prestacoes-de-contas/:id`.

Atualize `src/servidor.ts`:

```ts
import { app } from './app';

const porta = 3000;

app.listen(porta, () => {
  console.log(`Servidor rodando em http://localhost:${porta}`);
});
```

`app.ts` configura a aplicação. `servidor.ts` inicia a escuta na porta `3000`. Essa divisão permite localizar com facilidade a configuração HTTP e o ponto de inicialização.

**Checkpoint:** compile todos os arquivos e inicie o servidor:

```bash
npm run build
npm run dev
```

O terminal deve mostrar:

```text
Servidor rodando em http://localhost:3000
```

### 9. Testar GET, query parameter e POST

Mantenha `npm run dev` em execução e abra outro terminal.

Primeiro, liste as prestações:

```bash
curl http://localhost:3000/prestacoes-de-contas
```

Resposta inicial esperada:

```json
[]
```

Teste o query parameter:

```bash
curl "http://localhost:3000/prestacoes-de-contas/consulta?termo=viagem"
```

Resposta esperada:

```json
{ "termoRecebido": "viagem" }
```

Cadastre uma prestação. No Linux, macOS ou terminal Bash:

```bash
curl -X POST http://localhost:3000/prestacoes-de-contas \
  -H "Content-Type: application/json" \
  -d '{"empresa":"Empresa Exemplo Ltda.","descricao":"Hospedagem para visita técnica","valor":680,"dataVencimento":"2026-08-30"}'
```

No Windows PowerShell:

```powershell
$corpo = @{
  empresa = "Empresa Exemplo Ltda."
  descricao = "Hospedagem para visita técnica"
  valor = 680
  dataVencimento = "2026-08-30"
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3000/prestacoes-de-contas" `
  -ContentType "application/json" `
  -Body $corpo
```

Resposta esperada:

```json
{
  "id": 1,
  "empresa": "Empresa Exemplo Ltda.",
  "descricao": "Hospedagem para visita técnica",
  "valor": 680,
  "dataVencimento": "2026-08-30",
  "status": "PENDENTE"
}
```

Repita o `GET /prestacoes-de-contas`. A lista deve conter o objeto recém-criado.

### 10. Testar path parameter, PUT e PATCH

Consulte a prestação de identificador `1`:

```bash
curl http://localhost:3000/prestacoes-de-contas/1
```

Substitua os dados editáveis com `PUT`:

```bash
curl -X PUT http://localhost:3000/prestacoes-de-contas/1 \
  -H "Content-Type: application/json" \
  -d '{"empresa":"Empresa Exemplo Ltda.","descricao":"Hospedagem e deslocamento","valor":750,"dataVencimento":"2026-09-05"}'
```

O retorno mantém `id: 1` e `status: "PENDENTE"`, mas apresenta os novos dados.

Altere somente o status com `PATCH`:

```bash
curl -X PATCH http://localhost:3000/prestacoes-de-contas/1/status \
  -H "Content-Type: application/json" \
  -d '{"status":"RECEBIDA"}'
```

Resposta esperada:

```json
{
  "id": 1,
  "empresa": "Empresa Exemplo Ltda.",
  "descricao": "Hospedagem e deslocamento",
  "valor": 750,
  "dataVencimento": "2026-09-05",
  "status": "RECEBIDA"
}
```

No PowerShell, os mesmos testes podem ser feitos com `Invoke-RestMethod`, trocando `-Method` por `Put` ou `Patch` e fornecendo um objeto convertido com `ConvertTo-Json`, como no passo anterior.

Para testar o `PUT` no PowerShell:

```powershell
$corpo = @{
  empresa = "Empresa Exemplo Ltda."
  descricao = "Hospedagem e deslocamento"
  valor = 750
  dataVencimento = "2026-09-05"
} | ConvertTo-Json

Invoke-RestMethod -Method Put `
  -Uri "http://localhost:3000/prestacoes-de-contas/1" `
  -ContentType "application/json" `
  -Body $corpo
```

Para testar o `PATCH`:

```powershell
$corpo = @{ status = "RECEBIDA" } | ConvertTo-Json

Invoke-RestMethod -Method Patch `
  -Uri "http://localhost:3000/prestacoes-de-contas/1/status" `
  -ContentType "application/json" `
  -Body $corpo
```

### 11. Testar DELETE e respostas 404

Exclua a prestação:

```bash
curl -i -X DELETE http://localhost:3000/prestacoes-de-contas/1
```

O cabeçalho deve apresentar `204 No Content`, sem JSON no corpo.

Consulte novamente o mesmo identificador:

```bash
curl -i http://localhost:3000/prestacoes-de-contas/1
```

Resposta esperada:

```json
{ "mensagem": "Prestação de contas não encontrada" }
```

O status será `404 Not Found`. O mesmo tratamento ocorre ao tentar substituir, alterar o status ou excluir um identificador que não está no array.

No PowerShell, use `Invoke-WebRequest` para observar também os códigos de resposta:

```powershell
Invoke-WebRequest -Method Delete `
  -Uri "http://localhost:3000/prestacoes-de-contas/1"

Invoke-WebRequest `
  -Uri "http://localhost:3000/prestacoes-de-contas/1" `
  -SkipHttpErrorCheck
```

## Código completo

A estrutura usada ao final da aula é:

```text
backend/
├── src/
│   ├── controllers/
│   │   └── prestacaoContaController.ts
│   ├── routes/
│   │   └── prestacaoContaRotas.ts
│   ├── services/
│   │   └── prestacaoContaService.ts
│   ├── tipos/
│   │   └── prestacaoConta.ts
│   ├── app.ts
│   └── servidor.ts
├── package.json
└── tsconfig.json
```

O conteúdo completo de `src/tipos/prestacaoConta.ts`, `src/services/prestacaoContaService.ts`, `src/routes/prestacaoContaRotas.ts`, `src/app.ts` e `src/servidor.ts` foi apresentado integralmente no passo a passo.

O arquivo completo `src/controllers/prestacaoContaController.ts`, construído em três etapas, fica assim:

```ts
import { Request, Response } from 'express';
import {
  alterarStatusPrestacao,
  buscarPrestacaoPorId,
  criarPrestacao,
  excluirPrestacao,
  listarPrestacoes,
  substituirPrestacao,
} from '../services/prestacaoContaService';
import {
  CorpoStatusPrestacao,
  DadosPrestacaoConta,
  ParametrosId,
} from '../tipos/prestacaoConta';

export function listar(_requisicao: Request, resposta: Response): void {
  resposta.status(200).json(listarPrestacoes());
}

export function demonstrarConsulta(
  requisicao: Request,
  resposta: Response,
): void {
  resposta.status(200).json({
    termoRecebido: requisicao.query.termo ?? null,
  });
}

export function buscarPorId(
  requisicao: Request<ParametrosId>,
  resposta: Response,
): void {
  const id = Number(requisicao.params.id);
  const prestacao = buscarPrestacaoPorId(id);

  if (!prestacao) {
    resposta
      .status(404)
      .json({ mensagem: 'Prestação de contas não encontrada' });
    return;
  }

  resposta.status(200).json(prestacao);
}

export function criar(
  requisicao: Request<object, object, DadosPrestacaoConta>,
  resposta: Response,
): void {
  const prestacaoCriada = criarPrestacao(requisicao.body);
  resposta.status(201).json(prestacaoCriada);
}

export function substituir(
  requisicao: Request<ParametrosId, object, DadosPrestacaoConta>,
  resposta: Response,
): void {
  const id = Number(requisicao.params.id);
  const prestacaoAtualizada = substituirPrestacao(id, requisicao.body);

  if (!prestacaoAtualizada) {
    resposta
      .status(404)
      .json({ mensagem: 'Prestação de contas não encontrada' });
    return;
  }

  resposta.status(200).json(prestacaoAtualizada);
}

export function alterarStatus(
  requisicao: Request<ParametrosId, object, CorpoStatusPrestacao>,
  resposta: Response,
): void {
  const id = Number(requisicao.params.id);
  const prestacaoAtualizada = alterarStatusPrestacao(
    id,
    requisicao.body.status,
  );

  if (!prestacaoAtualizada) {
    resposta
      .status(404)
      .json({ mensagem: 'Prestação de contas não encontrada' });
    return;
  }

  resposta.status(200).json(prestacaoAtualizada);
}

export function excluir(
  requisicao: Request<ParametrosId>,
  resposta: Response,
): void {
  const id = Number(requisicao.params.id);
  const prestacaoExcluida = excluirPrestacao(id);

  if (!prestacaoExcluida) {
    resposta
      .status(404)
      .json({ mensagem: 'Prestação de contas não encontrada' });
    return;
  }

  resposta.status(204).send();
}
```

O `package.json` e o `tsconfig.json` permanecem com a configuração criada na Aula 1. Nenhuma nova dependência é necessária para executar esta aula.

## Erros comuns

* **`Cannot GET /prestacoes-de-contas`:** confira se `app.use('/prestacoes-de-contas', prestacaoContaRotas)` foi registrado em `app.ts` e se `servidor.ts` importa `app`.
* **`requisicao.body` chega como `undefined`:** `app.use(express.json())` precisa aparecer antes do registro das rotas, e a requisição deve enviar `Content-Type: application/json`.
* **A rota `/consulta` retorna 404:** registre `/consulta` antes de `/:id` em `prestacaoContaRotas.ts`.
* **Uma busca existente retorna 404:** path parameters são textos. Converta `requisicao.params.id` com `Number()` antes de chamar o service.
* **A lista volta a ficar vazia:** os registros pertencem ao processo em execução. Ao reiniciar `npm run dev`, o array é criado novamente.
* **O `DELETE` parece não responder:** o status `204` não possui body. Use `curl -i` para visualizar o código retornado.
* **O TypeScript informa import não encontrado:** confira os nomes `prestacaoContaController.ts`, `prestacaoContaService.ts`, `prestacaoContaRotas.ts` e `prestacaoConta.ts`, inclusive letras maiúsculas e minúsculas.

## Resumo

Nesta aula, evoluímos o backend da Aula 1 para uma API de prestações de contas com dados em memória. Usamos:

* `GET`, `POST`, `PUT`, `PATCH` e `DELETE` para representar operações diferentes;
* path parameter para identificar uma prestação;
* query parameter em uma rota demonstrativa;
* body para transportar os dados de criação e alteração;
* status `200`, `201`, `204` e `404` para comunicar resultados;
* routes para definir endpoints;
* controllers para tratar requisições e respostas HTTP;
* service para manipular o array de prestações.

O backend agora executa o ciclo de cadastro, consulta, substituição, alteração de status e exclusão usando o mesmo domínio e o mesmo projeto iniciado na aula anterior.
