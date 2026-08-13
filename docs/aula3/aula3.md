# Aula 3 — Clean Code, evolução do service, Swagger e Prettier

## Objetivo da aula

Evoluir a API de contas a receber construída em sala, sem recomeçar o projeto. Nesta aula, você concluirá as rotas que trabalham com dados em memória, corrigirá problemas do código inicial, aplicará princípios básicos de Clean Code, fará a validação do corpo da requisição, configurará o Prettier e documentará a API com Swagger.

## Resultado final

Ao final da aula, a aplicação permitirá:

* cadastrar uma conta;
* listar e filtrar contas por empresa ou status;
* consultar uma conta pelo identificador;
* atualizar os dados de uma conta;
* excluir uma conta;
* rejeitar corpos e identificadores inválidos;
* retornar códigos HTTP coerentes;
* acessar a documentação interativa em `http://localhost:3000/documentacao`;
* formatar o código com um comando do Prettier.

Os dados continuarão em memória. Portanto, a lista voltará ao estado inicial sempre que o servidor for reiniciado. A persistência será introduzida na próxima aula.

## Contexto

O ponto de partida desta aula é o projeto desenvolvido em sala. Ele já possui `servidor.ts`, um router, controllers, um middleware inicial, tipos e um service com um array de contas:

```text
src/
├── controllers/
│   ├── helloController.ts
│   ├── prestacaoContasController.ts
│   └── usariosController.ts
├── middlewares/
│   └── validarCorpo.ts
├── routes/
│   └── router.ts
├── services/
│   └── contasReceberService.ts
├── types/
│   └── prestacaoConta.ts
└── servidor.ts
```

Esse código foi importante para experimentar rotas, parâmetros, query parameters, body, controllers, services e middlewares. Agora ele será revisado para formar uma única API de contas a receber.

Os exemplos `helloController.ts` e `usariosController.ts` cumpriram a função de demonstrar rotas nas aulas iniciais. Eles não serão usados no fluxo final desta aula. Você pode mantê-los no projeto como referência, mas eles não serão importados pelo router.

O tipo criado em sala possui `notaFiscalBase64`. Nesta aula, esse campo continua sendo apenas um texto recebido e devolvido pela API. O funcionamento da codificação Base64, o envio de imagens e suas validações serão estudados na Aula 8.

## Explicação conceitual

### O que significa Clean Code neste projeto

Clean Code é o cuidado de tornar o código compreensível e seguro para futuras alterações. Não significa criar muitas camadas ou usar uma arquitetura complexa. Nesta API, aplicaremos práticas simples:

1. usar nomes que indiquem a intenção, como `contaEncontrada` e `indiceDaConta`;
2. manter funções pequenas, com uma responsabilidade principal;
3. retirar mensagens temporárias, como `console.log("oi")`;
4. evitar duas implementações diferentes para a mesma operação;
5. usar retornos antecipados quando houver erro;
6. manter o código HTTP no controller e a manipulação do array no service;
7. usar o tipo primitivo `string`, em vez do objeto `String`.

O objetivo não é apagar a história do projeto. Vamos reconhecer o código feito em sala, identificar o problema de cada trecho e evoluí-lo.

### Responsabilidade de cada parte

```text
requisição
   ↓
rota → middleware → controller → service → array em memória
                           ↓
                       resposta HTTP
```

| Parte | Responsabilidade |
| --- | --- |
| route | associa o método e o caminho às funções que serão executadas |
| middleware | verifica os dados antes de liberar a execução do controller |
| controller | lê a requisição e constrói a resposta HTTP |
| service | consulta ou modifica as contas mantidas em memória |
| types | descreve a forma dos dados usados pela aplicação |

O service não recebe `Request` nem `Response`. Dessa forma, ele não depende do Express. O controller não deve percorrer ou alterar diretamente o array `contas`.

### Validação em tempo de execução

O TypeScript verifica tipos durante o desenvolvimento, mas um cliente HTTP pode enviar qualquer JSON. Por isso, o middleware deve validar os dados enquanto a aplicação está executando.

Nesta aula, o corpo será aceito quando:

* `empresa` e `descricao` forem textos preenchidos;
* `data` for um texto preenchido;
* `valor` for um número maior que zero;
* `notaFiscalBase64` for um texto.

Ainda não verificaremos se `notaFiscalBase64` representa uma imagem válida. Essa regra pertence à aula específica de Base64.

### Códigos HTTP utilizados

| Código | Situação |
| --- | --- |
| `200 OK` | listagem, consulta ou atualização concluída |
| `201 Created` | conta cadastrada |
| `204 No Content` | conta excluída, sem corpo na resposta |
| `400 Bad Request` | body ou identificador inválido |
| `404 Not Found` | conta não encontrada |

Um identificador como `abc` recebe `400`, pois não é um número válido. O identificador `50` pode ser válido, mas inexistente; nesse caso, a resposta correta é `404`.

### Prettier, OpenAPI e Swagger

O Prettier formata automaticamente os arquivos. Ele padroniza aspas, ponto e vírgula, indentação e quebras de linha, sem definir regras de negócio.

OpenAPI é um formato para descrever uma API. Swagger UI apresenta essa descrição em uma página interativa, na qual você pode conhecer e executar as rotas pelo navegador.

## Preparação

Continue no mesmo projeto backend usado em sala:

```bash
cd /caminho/para/o/projeto/backend
```

Instale as dependências necessárias para esta aula:

```bash
npm install swagger-ui-express
npm install --save-dev @types/swagger-ui-express prettier
```

No `package.json`, mantenha os scripts que o projeto já possui e acrescente os scripts de formatação:

```json
{
  "scripts": {
    "dev": "tsx watch src/servidor.ts",
    "build": "tsc",
    "start": "node dist/servidor.js",
    "formatar": "prettier --write .",
    "verificar-formatacao": "prettier --check ."
  }
}
```

## Passo a passo

### 1. Planejar a evolução do código feito em sala

Ao final, continuaremos usando a estrutura conhecida pela turma e acrescentaremos somente o arquivo de configuração do Swagger:

```text
src/
├── configuracoes/
│   └── swagger.ts
├── controllers/
│   └── prestacaoContasController.ts
├── middlewares/
│   └── validarCorpo.ts
├── routes/
│   └── router.ts
├── services/
│   └── contasReceberService.ts
├── types/
│   └── prestacaoConta.ts
└── servidor.ts
```

Crie a pasta de configuração caso ela ainda não exista.

No Linux ou macOS:

```bash
mkdir -p src/configuracoes
touch src/configuracoes/swagger.ts
```

No Windows PowerShell:

```powershell
New-Item src/configuracoes -ItemType Directory -Force
New-Item src/configuracoes/swagger.ts -ItemType File -Force
```

### 2. Padronizar os tipos

Atualize `src/types/prestacaoConta.ts`:

```ts
export type StatusConta = 'PENDENTE' | 'RECEBIDA' | 'CANCELADA';

export interface DadosContaReceber {
  empresa: string;
  descricao: string;
  data: string;
  valor: number;
  notaFiscalBase64: string;
}

export interface ConsultaContas {
  empresa?: string;
  status?: StatusConta;
}

export interface ContaReceber extends DadosContaReceber {
  id: number;
  status: StatusConta;
}

export interface ParametrosId {
  id: string;
}
```

As interfaces continuam representando o contrato usado em sala. A melhoria está na consistência da escrita e no reaproveitamento de `DadosContaReceber` dentro de `ContaReceber`.

`ConsultaContas` usa `StatusConta` para limitar os valores reconhecidos pelo projeto. `ParametrosId` foi retirado do controller e colocado no arquivo de tipos porque também será usado pelo middleware.

**Checkpoint:** salve o arquivo e confirme que o TypeScript continua compilando:

```bash
npm run build
```

### 3. Refatorar o service

No código inicial, `excluirConta` continha duas formas de exclusão ao mesmo tempo. Além disso, `splice(-1, 1)` poderia remover a última conta quando o identificador não fosse encontrado, e o `filter` mantinha justamente a conta que deveria ser excluída.

Atualize `src/services/contasReceberService.ts`:

```ts
import {
  ContaReceber,
  DadosContaReceber,
  StatusConta,
} from '../types/prestacaoConta';

let contas: ContaReceber[] = [
  {
    id: 1,
    empresa: 'automasul',
    descricao: 'almoço em atividade externa',
    data: '2026-08-05',
    valor: 3.8,
    notaFiscalBase64: 'exemplo-temporario',
    status: 'PENDENTE',
  },
];

let proximoId = 2;

export function listarContas(
  empresa?: string,
  status?: StatusConta,
): ContaReceber[] {
  let resultado = contas;

  if (empresa) {
    const empresaConsultada = empresa.toLocaleLowerCase();
    resultado = resultado.filter((conta) =>
      conta.empresa.toLocaleLowerCase().includes(empresaConsultada),
    );
  }

  if (status) {
    resultado = resultado.filter((conta) => conta.status === status);
  }

  return resultado;
}

export function buscarContaPorId(id: number): ContaReceber | undefined {
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
  const contaEncontrada = buscarContaPorId(id);

  if (!contaEncontrada) {
    return undefined;
  }

  contaEncontrada.empresa = dados.empresa;
  contaEncontrada.descricao = dados.descricao;
  contaEncontrada.data = dados.data;
  contaEncontrada.valor = dados.valor;
  contaEncontrada.notaFiscalBase64 = dados.notaFiscalBase64;

  return contaEncontrada;
}

export function excluirConta(id: number): boolean {
  const indiceDaConta = contas.findIndex((conta) => conta.id === id);

  if (indiceDaConta === -1) {
    return false;
  }

  contas.splice(indiceDaConta, 1);
  return true;
}
```

Observe as decisões de Clean Code:

* `String` foi substituído por `string` e a conversão do parâmetro ficou fora do service;
* `==` foi substituído por `===`;
* os `console.log` temporários foram retirados;
* `buscarContaPorId` evita repetir a busca;
* `atualizarConta` devolve a conta atualizada, não apenas o identificador;
* `excluirConta` verifica o índice antes de usar `splice`;
* existe somente uma implementação para cada operação.

### 4. Fazer o middleware validar o corpo

O middleware criado em sala mostrava a passagem pelo fluxo com um `console.log` e sempre executava `proximo()`. Agora ele cumprirá a responsabilidade indicada pelo seu nome.

Atualize `src/middlewares/validarCorpo.ts`:

```ts
import { NextFunction, Request, Response } from 'express';
import { DadosContaReceber, ParametrosId } from '../types/prestacaoConta';

function textoPreenchido(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0;
}

export function validarDadosConta(
  requisicao: Request<object, object, DadosContaReceber>,
  resposta: Response,
  proximo: NextFunction,
): void {
  const corpo: unknown = requisicao.body;

  if (typeof corpo !== 'object' || corpo === null || Array.isArray(corpo)) {
    resposta.status(400).json({ mensagem: 'Informe os dados da conta' });
    return;
  }

  const { empresa, descricao, data, valor, notaFiscalBase64 } = corpo as Record<
    string,
    unknown
  >;

  if (!textoPreenchido(empresa) || !textoPreenchido(descricao)) {
    resposta
      .status(400)
      .json({ mensagem: 'Empresa e descrição são obrigatórias' });
    return;
  }

  if (!textoPreenchido(data)) {
    resposta.status(400).json({ mensagem: 'A data é obrigatória' });
    return;
  }

  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
    resposta
      .status(400)
      .json({ mensagem: 'O valor deve ser um número maior que zero' });
    return;
  }

  if (typeof notaFiscalBase64 !== 'string') {
    resposta
      .status(400)
      .json({ mensagem: 'A nota fiscal deve ser enviada como texto' });
    return;
  }

  proximo();
}

export function validarId(
  requisicao: Request<ParametrosId>,
  resposta: Response,
  proximo: NextFunction,
): void {
  const id = Number(requisicao.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    resposta.status(400).json({ mensagem: 'Identificador inválido' });
    return;
  }

  proximo();
}
```

Quando há um erro, o middleware envia a resposta e encerra a função com `return`. Quando os dados são válidos, `proximo()` libera a execução da próxima função da rota.

### 5. Deixar o controller concentrado em HTTP

Atualize `src/controllers/prestacaoContasController.ts`:

```ts
import { Request, Response } from 'express';
import {
  atualizarConta,
  buscarContaPorId,
  criarConta,
  excluirConta,
  listarContas,
} from '../services/contasReceberService';
import {
  ConsultaContas,
  DadosContaReceber,
  ParametrosId,
} from '../types/prestacaoConta';

export function listar(
  requisicao: Request<object, object, object, ConsultaContas>,
  resposta: Response,
): void {
  const { empresa, status } = requisicao.query;
  const contas = listarContas(empresa, status);

  resposta.status(200).json(contas);
}

export function buscarPorId(
  requisicao: Request<ParametrosId>,
  resposta: Response,
): void {
  const contaEncontrada = buscarContaPorId(Number(requisicao.params.id));

  if (!contaEncontrada) {
    resposta.status(404).json({ mensagem: 'Conta não encontrada' });
    return;
  }

  resposta.status(200).json(contaEncontrada);
}

export function criar(
  requisicao: Request<object, object, DadosContaReceber>,
  resposta: Response,
): void {
  const contaCriada = criarConta(requisicao.body);
  resposta.status(201).json(contaCriada);
}

export function atualizar(
  requisicao: Request<ParametrosId, object, DadosContaReceber>,
  resposta: Response,
): void {
  const contaAtualizada = atualizarConta(
    Number(requisicao.params.id),
    requisicao.body,
  );

  if (!contaAtualizada) {
    resposta.status(404).json({ mensagem: 'Conta não encontrada' });
    return;
  }

  resposta.status(200).json(contaAtualizada);
}

export function excluir(
  requisicao: Request<ParametrosId>,
  resposta: Response,
): void {
  const contaExcluida = excluirConta(Number(requisicao.params.id));

  if (!contaExcluida) {
    resposta.status(404).json({ mensagem: 'Conta não encontrada' });
    return;
  }

  resposta.status(204).send();
}
```

O controller converte `requisicao.params.id`, pois o parâmetro chega pela URL como texto. O service recebe um número e permanece independente do Express.

O código inicial respondia com `500` quando a conta não existia durante a atualização. Esse código indica uma falha inesperada do servidor. Como a requisição é válida e apenas não encontrou o recurso, usamos `404`.

### 6. Concluir e padronizar as rotas

No router inicial, o mesmo recurso aparecia em caminhos diferentes, como `/`, `/contas` e `/salvar-prestacao-contas/`. Isso dificulta prever os endereços da API.

Atualize `src/routes/router.ts`:

```ts
import { Router } from 'express';
import {
  atualizar,
  buscarPorId,
  criar,
  excluir,
  listar,
} from '../controllers/prestacaoContasController';
import { validarDadosConta, validarId } from '../middlewares/validarCorpo';

export const rotas = Router();

rotas.get('/contas', listar);
rotas.get('/contas/:id', validarId, buscarPorId);
rotas.post('/contas', validarDadosConta, criar);
rotas.put('/contas/:id', validarId, validarDadosConta, atualizar);
rotas.delete('/contas/:id', validarId, excluir);
```

Agora todas as operações usam o mesmo recurso, `/contas`. A ação é indicada pelo método HTTP, e não por verbos como `salvar` no endereço.

**Checkpoint:** execute novamente a compilação antes de acrescentar o Swagger:

```bash
npm run build
```

Se aparecer um erro de importação, confira primeiro os nomes `prestacaoContasController.ts`, `contasReceberService.ts` e `types/prestacaoConta.ts`, que são os nomes usados nesta versão.

### 7. Documentar a API com Swagger

Crie `src/configuracoes/swagger.ts`:

```ts
const esquemaDadosConta = {
  type: 'object',
  required: ['empresa', 'descricao', 'data', 'valor', 'notaFiscalBase64'],
  properties: {
    empresa: { type: 'string', example: 'automasul' },
    descricao: { type: 'string', example: 'almoço em atividade externa' },
    data: { type: 'string', format: 'date', example: '2026-08-05' },
    valor: { type: 'number', example: 35.8 },
    notaFiscalBase64: { type: 'string', example: 'exemplo-temporario' },
  },
};

const esquemaConta = {
  ...esquemaDadosConta,
  required: [...esquemaDadosConta.required, 'id', 'status'],
  properties: {
    id: { type: 'integer', example: 1 },
    ...esquemaDadosConta.properties,
    status: {
      type: 'string',
      enum: ['PENDENTE', 'RECEBIDA', 'CANCELADA'],
      example: 'PENDENTE',
    },
  },
};

const parametroId = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'integer', minimum: 1 },
};

const respostaContaNaoEncontrada = {
  description: 'Conta não encontrada',
};

export const documentacaoSwagger = {
  openapi: '3.0.3',
  info: {
    title: 'API de prestação de contas',
    version: '1.0.0',
    description: 'API em memória desenvolvida nas três primeiras aulas',
  },
  servers: [{ url: 'http://localhost:3000' }],
  paths: {
    '/contas': {
      get: {
        summary: 'Lista as contas',
        parameters: [
          { name: 'empresa', in: 'query', schema: { type: 'string' } },
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['PENDENTE', 'RECEBIDA', 'CANCELADA'],
            },
          },
        ],
        responses: {
          '200': {
            description: 'Lista retornada com sucesso',
            content: {
              'application/json': {
                schema: { type: 'array', items: esquemaConta },
              },
            },
          },
        },
      },
      post: {
        summary: 'Cadastra uma conta',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: esquemaDadosConta },
          },
        },
        responses: {
          '201': {
            description: 'Conta cadastrada',
            content: {
              'application/json': { schema: esquemaConta },
            },
          },
          '400': { description: 'Dados inválidos' },
        },
      },
    },
    '/contas/{id}': {
      get: {
        summary: 'Consulta uma conta pelo identificador',
        parameters: [parametroId],
        responses: {
          '200': {
            description: 'Conta encontrada',
            content: {
              'application/json': { schema: esquemaConta },
            },
          },
          '400': { description: 'Identificador inválido' },
          '404': respostaContaNaoEncontrada,
        },
      },
      put: {
        summary: 'Atualiza os dados de uma conta',
        parameters: [parametroId],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: esquemaDadosConta },
          },
        },
        responses: {
          '200': {
            description: 'Conta atualizada',
            content: {
              'application/json': { schema: esquemaConta },
            },
          },
          '400': { description: 'Identificador ou dados inválidos' },
          '404': respostaContaNaoEncontrada,
        },
      },
      delete: {
        summary: 'Exclui uma conta',
        parameters: [parametroId],
        responses: {
          '204': { description: 'Conta excluída' },
          '400': { description: 'Identificador inválido' },
          '404': respostaContaNaoEncontrada,
        },
      },
    },
  },
};
```

O objeto `documentacaoSwagger` descreve os mesmos caminhos registrados no `router.ts`. Se uma rota for alterada no código, sua documentação também deverá ser atualizada.

Os esquemas evitam repetir a descrição dos campos. `esquemaDadosConta` representa o body enviado pelo cliente; `esquemaConta` acrescenta `id` e `status`, controlados pelo servidor.

### 8. Registrar o Swagger no servidor

Atualize `src/servidor.ts`:

```ts
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { documentacaoSwagger } from './configuracoes/swagger';
import { rotas } from './routes/router';

const app = express();
const porta = 3000;

app.use(express.json());
app.use('/documentacao', swaggerUi.serve, swaggerUi.setup(documentacaoSwagger));
app.use(rotas);

app.listen(porta, () => {
  console.log(`Servidor rodando em http://localhost:${porta}`);
  console.log(`Swagger disponível em http://localhost:${porta}/documentacao`);
});
```

`express.json()` deve aparecer antes das rotas, pois ele transforma o JSON recebido no objeto `requisicao.body`. A rota `/documentacao` entrega a interface do Swagger, enquanto `app.use(rotas)` registra a API construída em sala.

**Checkpoint:** compile o projeto. Isso permite corrigir separadamente qualquer erro de tipo ou de importação relacionado ao Swagger.

```bash
npm run build
```

### 9. Configurar o Prettier

Na raiz do backend, crie `.prettierrc.json`:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 80
}
```

Crie também `.prettierignore`:

```text
node_modules
dist
package-lock.json
```

Formate e confira o projeto:

```bash
npm run formatar
npm run verificar-formatacao
npm run build
```

`formatar` modifica os arquivos para seguir o padrão. `verificar-formatacao` apenas informa se existe alguma divergência, o que é útil antes de entregar o projeto.

### 10. Executar e testar pelo Swagger

Inicie o servidor:

```bash
npm run dev
```

Acesse `http://localhost:3000/documentacao`. Expanda uma operação, selecione **Try it out**, informe os parâmetros e pressione **Execute**.

Teste nesta ordem:

1. Execute `GET /contas` para conferir o registro inicial.
2. Execute `POST /contas` com:

    ```json
    {
      "empresa": "upf",
      "descricao": "deslocamento para atividade acadêmica",
      "data": "2026-08-12",
      "valor": 42.5,
      "notaFiscalBase64": "exemplo-temporario"
    }
    ```

3. Execute `GET /contas/2` para consultar a conta criada.
4. Execute `PUT /contas/2` com todos os campos do body.
5. Execute `GET /contas?empresa=upf`.
6. Execute `GET /contas?status=PENDENTE`.
7. Execute `DELETE /contas/2` e observe o status `204`.
8. Repita `GET /contas/2` e observe o status `404`.
9. Execute `GET /contas/abc` e observe o status `400`.

## Código completo

Ao terminar, os arquivos principais devem corresponder aos códigos apresentados nos passos anteriores:

```text
src/configuracoes/swagger.ts
src/controllers/prestacaoContasController.ts
src/middlewares/validarCorpo.ts
src/routes/router.ts
src/services/contasReceberService.ts
src/types/prestacaoConta.ts
src/servidor.ts
.prettierignore
.prettierrc.json
package.json
```

Use esta conferência para evitar misturar versões. Os nomes acima preservam o projeto desenvolvido em sala; nomes alternativos, como `prestacaoContaRotas.ts`, `prestacaoContaService.ts`, `tipos/` ou uma separação em `app.ts`, não são necessários para acompanhar esta versão da Aula 3.

## Erros comuns

### A rota retorna `404` antes de chegar ao controller

Confira se o método e o caminho usados no Swagger são os mesmos do router. Nesta aula, todas as operações começam com `/contas`.

### `requisicao.body` aparece como `undefined`

Confirme se `app.use(express.json())` foi registrado antes de `app.use(rotas)`.

### O TypeScript não encontra `swagger-ui-express`

Confirme a instalação da biblioteca e de seus tipos:

```bash
npm install swagger-ui-express
npm install --save-dev @types/swagger-ui-express
```

### A exclusão remove uma conta incorreta

Nunca execute `splice` antes de verificar se `findIndex` devolveu `-1`. O valor `-1` representa que nenhum item foi encontrado.

### O filtro por empresa falha com letras maiúsculas

Converta tanto a empresa armazenada quanto o texto consultado para letras minúsculas antes de usar `includes`.

### A atualização de uma conta inexistente retorna `500`

Use `404`. A ausência do recurso é uma situação conhecida, e não uma falha inesperada do servidor.

### O middleware imprime a mensagem, mas aceita qualquer body

Um `console.log` ajuda a visualizar o fluxo, mas não valida dados. O middleware deve responder com `400` quando encontrar um problema e chamar `proximo()` somente quando o corpo for aceito.

### O Prettier formata arquivos gerados

Confira se `node_modules`, `dist` e `package-lock.json` estão no `.prettierignore`.

### O campo Base64 parece não funcionar como imagem

Nesta aula, `notaFiscalBase64` é somente um campo de texto preservado do código feito em sala. A conversão de imagens, o formato do conteúdo e suas validações serão tratados na Aula 8.

## Resumo

Nesta aula, você evoluiu o projeto realmente construído em sala. A API continuou usando `router.ts`, `prestacaoContasController.ts`, `contasReceberService.ts`, `validarCorpo.ts` e `types/prestacaoConta.ts`.

Você aplicou Clean Code com nomes mais claros, funções pequenas, retornos antecipados, remoção de duplicações e separação de responsabilidades. Também corrigiu a atualização e a exclusão, concluiu as rotas da API em memória, implementou validação básica, revisou os códigos HTTP, configurou o Prettier e publicou a documentação interativa com Swagger.

Na próxima aula, o array em memória começará a ser substituído pela persistência com MongoDB.
