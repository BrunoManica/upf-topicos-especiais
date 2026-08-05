# Aula 2 — API de contas a receber, Swagger e Prettier

## Objetivo da aula

Evoluir o backend iniciado na Aula 1 para uma API de prestação de contas. A aplicação permitirá cadastrar contas a receber de empresas, informar o valor de cada conta e enviar a imagem da nota fiscal em Base64.

Ao final, teremos rotas com `GET`, `POST`, `PUT`, `PATCH` e `DELETE`, exemplos de path parameters, query parameters e body, documentação interativa com Swagger e formatação automática com Prettier.

## Contexto

Uma empresa pode ter diversos valores a pagar. No sistema de prestação de contas, cada lançamento representa uma conta a receber e contém informações como empresa devedora, descrição, valor, vencimento e nota fiscal.

A nota fiscal será enviada como Base64. Nesse formato, os bytes de uma imagem são representados por texto, permitindo colocar a imagem dentro do mesmo JSON usado para cadastrar a conta.

Exemplo resumido:

```json
{
  "empresa": "Empresa Exemplo Ltda.",
  "valor": 1500,
  "notaFiscalBase64": "data:image/png;base64,iVBORw0KGgo..."
}
```

Nesta aula, as contas ficarão na memória enquanto o servidor estiver em execução. Assim, podemos praticar as requisições HTTP e visualizar seus resultados imediatamente.

## Explicação conceitual

### Métodos HTTP

| Método | Operação na API |
| --- | --- |
| `GET` | listar ou consultar uma conta |
| `POST` | cadastrar uma nova conta |
| `PUT` | substituir todos os dados editáveis de uma conta |
| `PATCH` | alterar somente o status da conta |
| `DELETE` | excluir uma conta |

O `PUT` exige todos os campos editáveis. O `PATCH` recebe somente o campo que precisa ser alterado.

### Path parameter, query parameter e body

Os dados podem chegar em partes diferentes da requisição:

* **Path parameter:** identifica um recurso. Em `/contas-receber/2`, o `2` está em `requisicao.params.id`.
* **Query parameter:** aplica um filtro. Em `/contas-receber?empresa=acme`, o valor está em `requisicao.query.empresa`.
* **Body:** transporta dados em JSON, como empresa, valor e nota fiscal.

É possível combinar filtros usando `&`:

```text
/contas-receber?empresa=acme&status=PENDENTE
```

### A imagem em Base64

Uma imagem Base64 costuma ser representada por uma Data URL:

```text
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
```

O início informa o tipo do arquivo e a parte depois da vírgula contém os bytes codificados. Base64 aumenta o tamanho do conteúdo em comparação com o arquivo original. Por isso, usaremos uma imagem pequena nos testes.

### Status HTTP

* `200`: consulta, alteração ou exclusão realizada;
* `201`: conta cadastrada;
* `400`: dados inválidos;
* `404`: conta não encontrada;
* `500`: erro inesperado no servidor.

### Swagger e Prettier

OpenAPI descreve rotas, parâmetros, bodies e respostas. Swagger UI transforma essa descrição em uma página que permite conhecer e testar a API pelo navegador.

Prettier formata o código automaticamente, mantendo espaçamento, aspas e quebras de linha consistentes.

## Setup inicial

Continue no backend da Aula 1:

```bash
cd /caminho/para/o/projeto/backend
npm install swagger-ui-express
npm install -D @types/swagger-ui-express prettier
npm pkg set scripts.formatar="prettier --write ."
```

## Passo a passo

### 1. Criar a estrutura de pastas

```text
backend/
├── src/
│   ├── configuracoes/
│   │   └── swagger.ts
│   ├── controllers/
│   │   └── contaReceberController.ts
│   ├── middlewares/
│   │   └── validarCorpo.ts
│   ├── routes/
│   │   └── contaReceberRotas.ts
│   ├── services/
│   │   └── contaReceberService.ts
│   ├── tipos/
│   │   └── contaReceber.ts
│   ├── app.ts
│   └── servidor.ts
├── .prettierignore
├── .prettierrc.json
├── package.json
└── tsconfig.json
```

No Linux ou macOS:

```bash
mkdir -p src/configuracoes src/controllers src/middlewares src/routes src/services src/tipos
touch src/app.ts src/configuracoes/swagger.ts
touch src/controllers/contaReceberController.ts
touch src/middlewares/validarCorpo.ts
touch src/routes/contaReceberRotas.ts src/services/contaReceberService.ts
touch src/tipos/contaReceber.ts
touch .prettierrc.json .prettierignore
```

No Windows PowerShell:

```powershell
mkdir src/configuracoes, src/controllers, src/middlewares, src/routes, src/services, src/tipos
New-Item src/app.ts -ItemType File
New-Item src/configuracoes/swagger.ts -ItemType File
New-Item src/controllers/contaReceberController.ts -ItemType File
New-Item src/middlewares/validarCorpo.ts -ItemType File
New-Item src/routes/contaReceberRotas.ts -ItemType File
New-Item src/services/contaReceberService.ts -ItemType File
New-Item src/tipos/contaReceber.ts -ItemType File
New-Item .prettierrc.json, .prettierignore -ItemType File
```

Nesta aula, usaremos somente as pastas necessárias para colocar as rotas em funcionamento. As rotas definem os endpoints, os middlewares tratam tarefas compartilhadas antes dos controllers, os controllers tratam HTTP, o service executa as operações das contas e a pasta `tipos` descreve o formato dos dados.

### 2. Configurar o Prettier

Crie `.prettierrc.json`:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all"
}
```

Crie `.prettierignore`:

```text
node_modules
dist
package-lock.json
```

### 3. Definir os tipos da conta a receber

Crie `src/tipos/contaReceber.ts`:

```ts
export type StatusConta = 'PENDENTE' | 'RECEBIDA' | 'CANCELADA';

export interface DadosContaReceber {
  empresa: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  notaFiscalBase64: string;
}

export interface CorpoStatus {
  status: StatusConta;
}

export interface ContaReceber {
  id: number;
  empresa: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  notaFiscalBase64: string;
  status: StatusConta;
}

export interface ParametrosId {
  id: string;
}

export interface ConsultaContas {
  empresa?: string;
  status?: string;
}

```

`ContaReceber` representa uma conta completa, incluindo o `id` e o `status`. `DadosContaReceber` representa somente os campos enviados pelo cliente no cadastro e na atualização.

Os outros tipos descrevem partes específicas das requisições HTTP: o parâmetro `id`, os filtros da listagem e o body usado para alterar o status.

### 4. Criar o service

Crie `src/services/contaReceberService.ts`:

```ts
import {
  ContaReceber,
  DadosContaReceber,
  StatusConta,
} from '../tipos/contaReceber';

const contas: ContaReceber[] = [];
let proximoId = 1;

export function listarContas(
  empresa?: string,
  status?: string,
): ContaReceber[] {
  let resultado = contas;

  if (empresa) {
    resultado = resultado.filter((conta) =>
      conta.empresa.toLowerCase().includes(empresa.toLowerCase()),
    );
  }

  if (status) {
    resultado = resultado.filter((conta) => conta.status === status);
  }

  return resultado;
}

export function buscarConta(id: number): ContaReceber | undefined {
  return contas.find((conta) => conta.id === id);
}

export function criarConta(dados: DadosContaReceber): ContaReceber {
  const novaConta: ContaReceber = {
    id: proximoId,
    ...dados,
    status: 'PENDENTE',
  };

  proximoId += 1;
  contas.push(novaConta);
  return novaConta;
}

export function atualizarConta(
  id: number,
  dados: DadosContaReceber,
): ContaReceber | undefined {
  const conta = buscarConta(id);

  if (!conta) {
    return undefined;
  }

  conta.empresa = dados.empresa;
  conta.descricao = dados.descricao;
  conta.valor = dados.valor;
  conta.dataVencimento = dados.dataVencimento;
  conta.notaFiscalBase64 = dados.notaFiscalBase64;
  return conta;
}

export function alterarStatusConta(
  id: number,
  status: StatusConta,
): ContaReceber | undefined {
  const conta = buscarConta(id);

  if (!conta) {
    return undefined;
  }

  conta.status = status;
  return conta;
}

export function excluirConta(id: number): boolean {
  const indice = contas.findIndex((conta) => conta.id === id);

  if (indice === -1) {
    return false;
  }

  contas.splice(indice, 1);
  return true;
}
```

O service mantém os dados em memória e executa as operações. A criação define o status inicial como `PENDENTE`.

### 5. Criar o middleware de validação

Crie `src/middlewares/validarCorpo.ts`:

```ts
import { NextFunction, Request, Response } from 'express';
import { CorpoStatus, DadosContaReceber } from '../tipos/contaReceber';

// Valida os campos usados no cadastro e na atualização de uma conta.
export function validarDadosConta(
  // Request recebe, nesta ordem: parâmetros da rota, corpo da resposta e body da requisição.
  // Os dois object indicam que não precisamos tipar os primeiros itens nesta função.
  // DadosContaReceber dá autocomplete ao body, mas não valida o JSON durante a execução.
  requisicao: Request<object, object, DadosContaReceber>,
  resposta: Response,
  proximo: NextFunction,
): void {
  const dados = requisicao.body;

  if (!dados.empresa) {
    resposta.status(400).json({ mensagem: 'Informe a empresa' });
    return;
  }

  if (!dados.descricao) {
    resposta.status(400).json({ mensagem: 'Informe a descrição' });
    return;
  }

  if (dados.valor <= 0) {
    resposta.status(400).json({ mensagem: 'O valor deve ser maior que zero' });
    return;
  }

  if (!dados.dataVencimento || !dados.notaFiscalBase64) {
    resposta.status(400).json({ mensagem: 'Preencha todos os campos' });
    return;
  }

  // next libera a requisição para o controller quando os dados são válidos.
  proximo();
}

// O PATCH aceita somente um dos status definidos pela aplicação.
export function validarStatus(
  requisicao: Request<object, object, CorpoStatus>,
  resposta: Response,
  proximo: NextFunction,
): void {
  const statusPermitidos = ['PENDENTE', 'RECEBIDA', 'CANCELADA'];

  if (!statusPermitidos.includes(requisicao.body.status)) {
    resposta.status(400).json({ mensagem: 'Status inválido' });
    return;
  }

  proximo();
}
```

O middleware é uma função executada entre a chegada da requisição e o controller. Se o body for inválido, ele responde com `400` e encerra o fluxo. Se for válido, chama `proximo()` para liberar a execução do controller.

O tipo `Request` do Express permite descrever diferentes partes da requisição usando tipos genéricos. Os quatro tipos principais seguem esta ordem:

```ts
Request<ParametrosDaRota, CorpoDaResposta, CorpoDaRequisicao, Query>
```

Por isso, no middleware usamos:

```ts
Request<object, object, DadosContaReceber>
```

O primeiro `object` indica que não estamos descrevendo parâmetros da rota. O segundo indica que não precisamos definir um formato específico para o corpo da resposta. `DadosContaReceber`, na terceira posição, informa ao TypeScript o formato esperado em `requisicao.body`.

Com isso, o editor oferece autocomplete para `requisicao.body.empresa` e acusa um erro ao tentar acessar um campo inexistente. Essa tipagem funciona somente durante o desenvolvimento: ela não verifica o JSON enviado pelo cliente. A validação em tempo de execução continua sendo responsabilidade do middleware.

Nesta aula a validação foi escrita com condições simples para manter o foco no fluxo do Express. Bibliotecas de schema e validações mais completas podem ser apresentadas em uma aula posterior.

### 6. Criar o controller

Crie `src/controllers/contaReceberController.ts`:

```ts
import { Request, Response } from 'express';
import {
  alterarStatusConta,
  atualizarConta,
  buscarConta,
  criarConta,
  excluirConta,
  listarContas,
} from '../services/contaReceberService';
import {
  ConsultaContas,
  CorpoStatus,
  DadosContaReceber,
  ParametrosId,
} from '../tipos/contaReceber';

export function listar(
  requisicao: Request<object, object, object, ConsultaContas>,
  resposta: Response,
): void {
  const { empresa, status } = requisicao.query;
  resposta.status(200).json(listarContas(empresa, status));
}

export function buscarPorId(
  requisicao: Request<ParametrosId>,
  resposta: Response,
): void {
  const conta = buscarConta(Number(requisicao.params.id));

  if (!conta) {
    resposta.status(404).json({ mensagem: 'Conta não encontrada' });
    return;
  }

  resposta.status(200).json(conta);
}

export function criar(
  // O terceiro tipo de Request descreve o formato esperado em requisicao.body.
  requisicao: Request<object, object, DadosContaReceber>,
  resposta: Response,
): void {
  // O middleware já validou o body.
  resposta.status(201).json(criarConta(requisicao.body));
}

export function atualizar(
  requisicao: Request<ParametrosId, object, DadosContaReceber>,
  resposta: Response,
): void {
  const conta = atualizarConta(Number(requisicao.params.id), requisicao.body);

  if (!conta) {
    resposta.status(404).json({ mensagem: 'Conta não encontrada' });
    return;
  }

  resposta.status(200).json(conta);
}

export function alterarStatus(
  requisicao: Request<ParametrosId, object, CorpoStatus>,
  resposta: Response,
): void {
  const conta = alterarStatusConta(
    Number(requisicao.params.id),
    requisicao.body.status,
  );

  if (!conta) {
    resposta.status(404).json({ mensagem: 'Conta não encontrada' });
    return;
  }

  resposta.status(200).json(conta);
}

export function excluir(
  requisicao: Request<ParametrosId>,
  resposta: Response,
): void {
  const contaFoiExcluida = excluirConta(Number(requisicao.params.id));

  if (!contaFoiExcluida) {
    resposta.status(404).json({ mensagem: 'Conta não encontrada' });
    return;
  }

  resposta.status(200).json({ mensagem: 'Conta excluída com sucesso' });
}
```

O controller lê `params`, `query` e `body`, chama o service e escolhe o status HTTP da resposta. Ele pode trabalhar com `DadosContaReceber` porque as rotas garantem que o middleware seja executado antes dele.

O service também recebe dados já validados e concentra as operações e regras de negócio. Assim, middleware, controller e service possuem responsabilidades diferentes.

### 7. Definir as rotas

Crie `src/routes/contaReceberRotas.ts`:

```ts
import { Router } from 'express';
import {
  alterarStatus,
  atualizar,
  buscarPorId,
  criar,
  excluir,
  listar,
} from '../controllers/contaReceberController';
import { validarDadosConta, validarStatus } from '../middlewares/validarCorpo';

export const contaReceberRotas = Router();

contaReceberRotas.get('/', listar);
contaReceberRotas.get('/:id', buscarPorId);
// O middleware valida o body antes de entregar a requisição ao controller.
contaReceberRotas.post('/', validarDadosConta, criar);
contaReceberRotas.put('/:id', validarDadosConta, atualizar);
contaReceberRotas.patch('/:id/status', validarStatus, alterarStatus);
contaReceberRotas.delete('/:id', excluir);
```

As rotas de escrita recebem duas funções. O Express executa primeiro o middleware de validação; o controller só é executado quando o middleware chama `proximo()`.

### 8. Configurar o Swagger

Crie `src/configuracoes/swagger.ts`:

```ts
const corpoConta = {
  type: 'object',
  required: ['empresa', 'descricao', 'valor', 'dataVencimento', 'notaFiscalBase64'],
  properties: {
    empresa: { type: 'string', example: 'Empresa Exemplo Ltda.' },
    descricao: { type: 'string', example: 'Serviço de desenvolvimento' },
    valor: { type: 'number', example: 1500 },
    dataVencimento: { type: 'string', format: 'date', example: '2026-08-15' },
    notaFiscalBase64: {
      type: 'string',
      example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB',
    },
  },
};

const parametroId = {
  in: 'path',
  name: 'id',
  required: true,
  schema: { type: 'integer' },
};

export const documentacaoSwagger = {
  openapi: '3.0.0',
  info: {
    title: 'API de Prestação de Contas',
    version: '1.0.0',
    description: 'Cadastro e acompanhamento de contas a receber.',
  },
  servers: [{ url: 'http://localhost:3000' }],
  paths: {
    '/contas-receber': {
      get: {
        summary: 'Lista as contas a receber',
        tags: ['Contas a receber'],
        parameters: [
          { in: 'query', name: 'empresa', schema: { type: 'string' } },
          {
            in: 'query',
            name: 'status',
            schema: { type: 'string', enum: ['PENDENTE', 'RECEBIDA', 'CANCELADA'] },
          },
        ],
        responses: { '200': { description: 'Lista de contas' } },
      },
      post: {
        summary: 'Cadastra uma conta a receber',
        tags: ['Contas a receber'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: corpoConta } },
        },
        responses: {
          '201': { description: 'Conta cadastrada' },
          '400': { description: 'Dados inválidos' },
        },
      },
    },
    '/contas-receber/{id}': {
      get: {
        summary: 'Consulta uma conta pelo ID',
        tags: ['Contas a receber'],
        parameters: [parametroId],
        responses: {
          '200': { description: 'Conta encontrada' },
          '404': { description: 'Conta não encontrada' },
        },
      },
      put: {
        summary: 'Atualiza todos os dados editáveis da conta',
        tags: ['Contas a receber'],
        parameters: [parametroId],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: corpoConta } },
        },
        responses: {
          '200': { description: 'Conta atualizada' },
          '400': { description: 'Dados inválidos' },
          '404': { description: 'Conta não encontrada' },
        },
      },
      delete: {
        summary: 'Exclui uma conta',
        tags: ['Contas a receber'],
        parameters: [parametroId],
        responses: {
          '200': { description: 'Conta excluída' },
          '404': { description: 'Conta não encontrada' },
        },
      },
    },
    '/contas-receber/{id}/status': {
      patch: {
        summary: 'Altera somente o status da conta',
        tags: ['Contas a receber'],
        parameters: [parametroId],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['PENDENTE', 'RECEBIDA', 'CANCELADA'],
                    example: 'RECEBIDA',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Status alterado' },
          '400': { description: 'Status inválido' },
          '404': { description: 'Conta não encontrada' },
        },
      },
    },
  },
};
```

### 9. Configurar e iniciar a aplicação

Crie `src/app.ts`:

```ts
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { documentacaoSwagger } from './configuracoes/swagger';
import { contaReceberRotas } from './routes/contaReceberRotas';

export const app = express();

app.use(express.json({ limit: '5mb' }));
app.use('/documentacao', swaggerUi.serve, swaggerUi.setup(documentacaoSwagger));
app.use('/contas-receber', contaReceberRotas);
```

O limite foi definido como `5mb` porque o JSON com uma imagem Base64 pode ser maior que um JSON comum. Isso não significa que toda imagem será aceita: o cliente deve reduzir a imagem antes do envio quando ela for muito grande.

Substitua `src/servidor.ts` por:

```ts
import { app } from './app';

const porta = 3000;

app.listen(porta, () => {
  console.log(`Servidor rodando em http://localhost:${porta}`);
  console.log(`Swagger disponível em http://localhost:${porta}/documentacao`);
});
```

### 10. Formatar, compilar e executar

```bash
npm run formatar
npm run build
npm run dev
```

Abra `http://localhost:3000/documentacao`, escolha uma rota, clique em **Try it out** e depois em **Execute**.

### 11. Testar as requisições

Listar contas:

```bash
curl http://localhost:3000/contas-receber
```

Filtrar por empresa e status:

```bash
curl "http://localhost:3000/contas-receber?empresa=exemplo&status=PENDENTE"
```

Buscar pelo path parameter `id`:

```bash
curl http://localhost:3000/contas-receber/1
```

Cadastrar uma conta com a nota fiscal no body:

```bash
curl -X POST http://localhost:3000/contas-receber \
  -H "Content-Type: application/json" \
  -d '{"empresa":"Empresa ABC Ltda.","descricao":"Serviço de consultoria","valor":2300.50,"dataVencimento":"2026-08-30","notaFiscalBase64":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB"}'
```

Atualizar todos os dados editáveis:

```bash
curl -X PUT http://localhost:3000/contas-receber/1 \
  -H "Content-Type: application/json" \
  -d '{"empresa":"Empresa Exemplo Ltda.","descricao":"Serviço atualizado","valor":1750,"dataVencimento":"2026-09-10","notaFiscalBase64":"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ"}'
```

Marcar a conta como recebida:

```bash
curl -X PATCH http://localhost:3000/contas-receber/1/status \
  -H "Content-Type: application/json" \
  -d '{"status":"RECEBIDA"}'
```

Excluir uma conta:

```bash
curl -X DELETE http://localhost:3000/contas-receber/1
```

## Código completo

Ao final da aula, a parte executada da aplicação é:

```text
src/
├── configuracoes/
│   └── swagger.ts
├── controllers/
│   └── contaReceberController.ts
├── routes/
│   └── contaReceberRotas.ts
├── services/
│   └── contaReceberService.ts
├── tipos/
│   └── contaReceber.ts
├── app.ts
└── servidor.ts
```

Todos os arquivos completos foram apresentados nos passos anteriores. Os scripts principais do `package.json` são:

```json
{
  "scripts": {
    "dev": "tsx watch src/servidor.ts",
    "build": "tsc",
    "start": "node dist/servidor.js",
    "formatar": "prettier --write ."
  }
}
```

## Erros comuns

* **`requisicao.body` está vazio:** confirme que `express.json()` aparece antes das rotas e envie `Content-Type: application/json`.
* **A resposta é `413 Payload Too Large`:** a imagem ultrapassou o limite do JSON. Reduza a imagem ou confira o limite configurado.
* **A imagem não aparece ao recuperar a conta:** confira se o valor enviado contém a Data URL completa, incluindo o tipo da imagem e `;base64,`.
* **O filtro não funciona:** query parameters começam com `?` e são separados por `&`.
* **`Cannot GET /contas-receber`:** confira o método, a URL e o registro das rotas em `app.ts`.
* **O Swagger não abre:** use `/documentacao` e confira a instalação de `swagger-ui-express`.
* **Os dados desaparecem ao reiniciar:** nesta implementação, a lista está na memória do processo e volta ao estado inicial com o servidor.

## Resumo

Nesta aula, construímos uma API de contas a receber vinculadas a empresas. Praticamos `GET`, `POST`, `PUT`, `PATCH` e `DELETE`, usamos path parameters, query parameters e body, e recebemos a imagem da nota fiscal como Base64. Também configuramos a estrutura de pastas, o Prettier e a documentação Swagger.
