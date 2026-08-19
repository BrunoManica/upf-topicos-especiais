# Aula 4 — MongoDB e persistência de dados

## Objetivo da aula

Construir, uma API completa de prestações de contas e persistir seus dados no MongoDB. Você executará o banco com Docker, configurará o Mongoose e implementará o fluxo `rota → middleware → controller → service → repository → model → MongoDB`.

HTTP, rotas, controllers, services e validação de entrada já foram trabalhados. Por isso, esses assuntos serão retomados apenas no nível necessário para reconstruir o projeto. O Zod será usado objetivamente para descrever e validar os dados recebidos. O foco novo está na conexão com o banco e na substituição do array em memória por documentos persistidos.

## Resultado final

Ao final, você terá um backend executável com estas operações:

| Método | Rota | Operação |
| --- | --- | --- |
| `GET` | `/prestacoes-de-contas` | listar prestações |
| `GET` | `/prestacoes-de-contas/:id` | consultar uma prestação |
| `POST` | `/prestacoes-de-contas` | cadastrar uma prestação |
| `PUT` | `/prestacoes-de-contas/:id` | atualizar os dados da prestação |
| `PATCH` | `/prestacoes-de-contas/:id/status` | alterar somente o status |
| `DELETE` | `/prestacoes-de-contas/:id` | excluir uma prestação |

A documentação interativa ficará em `http://localhost:3000/documentacao`. Os registros continuarão disponíveis após reiniciar a API e também após remover e recriar o container, desde que o volume do MongoDB seja preservado.

## Contexto

Até aqui, a API utilizava um array. Esse recurso é útil para aprender o fluxo HTTP, mas todo registro desaparece quando o processo Node.js termina. Nesta aula, cada prestação será armazenada como um documento na coleção `prestacoes_contas`.

O campo `notaFiscalBase64` será mantido como texto para preservar o contrato da API. Use apenas um texto de exemplo nesta aula. Conversão, validação e envio de imagens em Base64 serão estudados na aula própria desse assunto.

## Explicação conceitual

### MongoDB, documentos e coleções

O MongoDB organiza dados em documentos agrupados em coleções.

| Conceito | Neste projeto |
| --- | --- |
| banco | `prestacao_contas` |
| coleção | `prestacoes_contas` |
| documento | uma prestação de contas |
| campo | empresa, descrição, valor, vencimento e status |

Um documento será semelhante a este:

```json
{
  "_id": "66bd3aa9e1741bcbad7497c1",
  "empresa": "Empresa Exemplo Ltda.",
  "descricao": "Hospedagem em viagem de trabalho",
  "valor": 350,
  "dataVencimento": "2026-08-20",
  "notaFiscalBase64": "exemplo-temporario",
  "status": "PENDENTE"
}
```

O MongoDB cria o `_id`. Na resposta HTTP, a aplicação o apresentará como `id`, também textual.

### Imagem, container e volume

| Termo | Significado |
| --- | --- |
| imagem | pacote usado para criar o MongoDB em uma versão definida |
| container | processo isolado que executa essa imagem |
| volume | armazenamento que preserva os arquivos do banco |

Somente o MongoDB será executado no Docker. A API continuará rodando na máquina com `npm run dev`.

### Responsabilidade das camadas

```text
requisição HTTP
      ↓
rota → middleware Zod → controller → service → repository → model Mongoose
                                                                    ↓
                                                                 MongoDB
```

| Camada | Responsabilidade |
| --- | --- |
| rota | relacionar método, endereço, middleware e controller |
| middleware | validar entrada antes do controller |
| controller | ler a requisição e produzir a resposta HTTP |
| service | aplicar regras de negócio e delegar a persistência |
| repository | concentrar todo acesso ao model |
| model | definir o schema e representar a coleção |

Neste projeto, nenhum arquivo fora do repository chamará métodos como `find`, `findById`, `create` ou `findByIdAndUpdate`. A regra de que toda prestação nasce com status `PENDENTE` ficará no service.

### Operações assíncronas

O banco responde por entrada e saída. Por isso, as funções que dependem dele retornam `Promise` e usam `async` e `await`:

```ts
const prestacoes = await listarPrestacoes(empresa, status);
```

O `await` aguarda o resultado antes de continuar a execução da função.

## Preparação

Você precisa ter Node.js, npm e Docker instalados. No Windows e macOS, o Docker Desktop fornece o Docker Compose. No Linux, use Docker Engine com o plugin Compose.

Confira as ferramentas:

```bash
node --version
npm --version
docker --version
docker compose version
```

Crie uma pasta vazia para o backend e entre nela:

```bash
mkdir backend
cd backend
```

## Passo a passo

### Orientação para acompanhar em aula

O tutorial apresenta todos os arquivos para que o projeto funcione mesmo em uma pasta vazia. Para aproveitar o tempo, copie e aplique diretamente os trechos de HTTP, rotas, controller, service, validação, Swagger e Prettier que você já reconhecer. Faça os checkpoints indicados, mas concentre a análise e as dúvidas em Docker, MongoDB, Mongoose, model, repository e persistência.

### 1. Iniciar o projeto Node.js

Crie o `package.json` inicial e instale as dependências:

```bash
npm init -y
npm install express@5 mongoose@8 dotenv@17 zod@4 swagger-ui-express@5
npm install --save-dev typescript@5 tsx@4 prettier@3 @types/node@24 @types/express@5 @types/swagger-ui-express@4
```

Substitua o conteúdo de `package.json` por:

```json
{
  "name": "backend-prestacao-contas",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/servidor.ts",
    "build": "tsc",
    "start": "node dist/servidor.js",
    "formatar": "prettier --write .",
    "verificar-formatacao": "prettier --check ."
  },
  "dependencies": {
    "dotenv": "^17.0.0",
    "express": "^5.0.0",
    "mongoose": "^8.0.0",
    "swagger-ui-express": "^5.0.0",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/node": "^24.0.0",
    "@types/swagger-ui-express": "^4.1.0",
    "prettier": "^3.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

As faixas com `^` permitem versões compatíveis. O arquivo gerado por `npm install`, chamado `package-lock.json`, registra as versões efetivamente instaladas e deve ser mantido no projeto.

**Checkpoint:** confirme que as dependências foram instaladas:

```bash
npm list --depth=0
```

### 2. Configurar TypeScript e Prettier

Crie `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"]
}
```

Crie `.prettierrc.json`:

```json
{
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all"
}
```

Crie `.prettierignore`:

```text
dist
node_modules
package-lock.json
```

Crie `.gitignore`:

```text
node_modules
dist
.env
```

### 3. Criar a estrutura de pastas

No Linux ou macOS:

```bash
mkdir -p src/configuracoes src/controllers src/middlewares src/models src/repositories src/routes src/services src/tipos
```

No Windows PowerShell:

```powershell
$pastas = 'configuracoes','controllers','middlewares','models','repositories','routes','services','tipos'
$pastas | ForEach-Object { New-Item "src/$_" -ItemType Directory -Force }
```

Ao terminar, o projeto terá esta estrutura:

```text
backend/
├── src/
│   ├── configuracoes/
│   │   ├── banco.ts
│   │   └── swagger.ts
│   ├── controllers/
│   │   └── prestacaoContaController.ts
│   ├── middlewares/
│   │   └── validarPrestacaoConta.ts
│   ├── models/
│   │   └── prestacaoContaModel.ts
│   ├── repositories/
│   │   └── prestacaoContaRepository.ts
│   ├── routes/
│   │   └── prestacaoContaRotas.ts
│   ├── services/
│   │   └── prestacaoContaService.ts
│   ├── tipos/
│   │   └── prestacaoConta.ts
│   ├── app.ts
│   └── servidor.ts
├── .env
├── .env.example
├── .gitignore
├── .prettierignore
├── .prettierrc.json
├── compose.yaml
├── package.json
└── tsconfig.json
```

### 4. Executar o MongoDB com Docker

Crie `compose.yaml` na raiz do backend:

```yaml
services:
  mongodb:
    image: mongo:8.0.11
    container_name: mongodb-prestacao-contas
    ports:
      - "127.0.0.1:27017:27017"
    volumes:
      - dados_mongodb:/data/db
    restart: unless-stopped

volumes:
  dados_mongodb:
```

A porta do MongoDB fica acessível somente pela própria máquina. O volume `dados_mongodb` guarda os arquivos do banco fora do ciclo de vida do container.

Inicie o banco:

```bash
docker compose up -d
```

Confira o estado:

```bash
docker compose ps
```

Se precisar investigar a inicialização:

```bash
docker compose logs -f mongodb
```

Use `Ctrl+C` para sair dos logs. Isso não encerra o container.

Comandos úteis:

```bash
docker compose stop
docker compose start
docker compose down
```

`stop` para o container sem removê-lo. `down` remove o container e a rede, mas preserva o volume. Não use `docker compose down -v` nesta aula, pois `-v` remove também os dados.

**Checkpoint:** `docker compose ps` deve mostrar o serviço `mongodb` em execução.

### 5. Configurar as variáveis de ambiente

Crie `.env`:

```dotenv
MONGODB_URL=mongodb://localhost:27017/prestacao_contas
PORTA=3000
```

Crie `.env.example` com o mesmo conteúdo:

```dotenv
MONGODB_URL=mongodb://localhost:27017/prestacao_contas
PORTA=3000
```

O `.env` configura a máquina atual e não deve ser versionado. O `.env.example` documenta quais variáveis o projeto exige.

### 6. Definir os tipos da aplicação

Crie `src/tipos/prestacaoConta.ts`:

```ts
export type StatusPrestacao = 'PENDENTE' | 'RECEBIDA' | 'CANCELADA';

export interface DadosPrestacaoConta {
  empresa: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  notaFiscalBase64: string;
}

export interface PrestacaoConta extends DadosPrestacaoConta {
  id: string;
  status: StatusPrestacao;
}

export interface CorpoStatus {
  status: StatusPrestacao;
}

export interface ParametrosId {
  id: string;
}

export interface ConsultaPrestacoes {
  empresa?: string;
  status?: StatusPrestacao;
}
```

Esses tipos descrevem o contrato interno. O `id` é uma `string`, pois representa o `_id` criado pelo MongoDB.

### 7. Criar o model Mongoose

Crie `src/models/prestacaoContaModel.ts`:

```ts
import { model, Schema } from 'mongoose';
import { StatusPrestacao } from '../tipos/prestacaoConta';

export interface PrestacaoContaDocumento {
  empresa: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  notaFiscalBase64: string;
  status: StatusPrestacao;
}

const prestacaoContaSchema = new Schema<PrestacaoContaDocumento>(
  {
    empresa: { type: String, required: true, trim: true },
    descricao: { type: String, required: true, trim: true },
    valor: { type: Number, required: true, min: 0.01 },
    dataVencimento: { type: String, required: true },
    notaFiscalBase64: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDENTE', 'RECEBIDA', 'CANCELADA'],
      required: true,
    },
  },
  {
    collection: 'prestacoes_contas',
    timestamps: true,
    versionKey: false,
  },
);

export const PrestacaoContaModel = model<PrestacaoContaDocumento>(
  'PrestacaoConta',
  prestacaoContaSchema,
);
```

O schema define a forma persistida e proteções mínimas. A validação amigável da requisição continuará no Zod. Nesta aula, usamos `collection` para definir o nome da coleção, `timestamps` para registrar criação e alteração e `versionKey: false` para omitir o campo de versão. Essas opções são suficientes para a persistência de agora; a modelagem e as opções do Mongoose serão aprofundadas na Aula 5.

### 8. Criar o repository

Crie `src/repositories/prestacaoContaRepository.ts`:

```ts
import { FilterQuery } from 'mongoose';
import {
  PrestacaoContaDocumento,
  PrestacaoContaModel,
} from '../models/prestacaoContaModel';
import {
  PrestacaoConta,
  DadosPrestacaoConta,
  StatusPrestacao,
} from '../tipos/prestacaoConta';

function converterDocumento(documento: {
  _id: unknown;
  empresa: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  notaFiscalBase64: string;
  status: StatusPrestacao;
}): PrestacaoConta {
  return {
    id: String(documento._id),
    empresa: documento.empresa,
    descricao: documento.descricao,
    valor: documento.valor,
    dataVencimento: documento.dataVencimento,
    notaFiscalBase64: documento.notaFiscalBase64,
    status: documento.status,
  };
}

function escaparExpressaoRegular(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function idValido(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

export async function listar(
  empresa?: string,
  status?: StatusPrestacao,
): Promise<PrestacaoConta[]> {
  const filtro: FilterQuery<PrestacaoContaDocumento> = {};

  if (empresa) {
    filtro.empresa = {
      $regex: escaparExpressaoRegular(empresa),
      $options: 'i',
    };
  }

  if (status) {
    filtro.status = status;
  }

  const documentos = await PrestacaoContaModel.find(filtro);
  return documentos.map(converterDocumento);
}

export async function buscarPorId(id: string): Promise<PrestacaoConta | null> {
  if (!idValido(id)) {
    return null;
  }

  const documento = await PrestacaoContaModel.findById(id);
  return documento ? converterDocumento(documento) : null;
}

export async function criar(
  dados: DadosPrestacaoConta & { status: StatusPrestacao },
): Promise<PrestacaoConta> {
  const documento = await PrestacaoContaModel.create(dados);
  return converterDocumento(documento);
}

export async function atualizar(
  id: string,
  dados: DadosPrestacaoConta,
): Promise<PrestacaoConta | null> {
  if (!idValido(id)) {
    return null;
  }

  const documento = await PrestacaoContaModel.findByIdAndUpdate(id, dados, {
    new: true,
    runValidators: true,
  });

  return documento ? converterDocumento(documento) : null;
}

export async function alterarStatus(
  id: string,
  status: StatusPrestacao,
): Promise<PrestacaoConta | null> {
  if (!idValido(id)) {
    return null;
  }

  const documento = await PrestacaoContaModel.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true },
  );

  return documento ? converterDocumento(documento) : null;
}

export async function excluir(id: string): Promise<boolean> {
  if (!idValido(id)) {
    return false;
  }

  const documento = await PrestacaoContaModel.findByIdAndDelete(id);
  return documento !== null;
}
```

Todo acesso ao model está neste arquivo. `converterDocumento` impede que detalhes do Mongoose escapem para as demais camadas. As opções `new: true` e `runValidators: true` devolvem o documento atualizado e aplicam as regras do schema.

### 9. Criar o service

Crie `src/services/prestacaoContaService.ts`:

```ts
import * as prestacaoContaRepository from '../repositories/prestacaoContaRepository';
import {
  PrestacaoConta,
  DadosPrestacaoConta,
  StatusPrestacao,
} from '../tipos/prestacaoConta';

export function listarPrestacoes(
  empresa?: string,
  status?: StatusPrestacao,
): Promise<PrestacaoConta[]> {
  return prestacaoContaRepository.listar(empresa, status);
}

export function buscarPrestacao(id: string): Promise<PrestacaoConta | null> {
  return prestacaoContaRepository.buscarPorId(id);
}

export function criarPrestacao(dados: DadosPrestacaoConta): Promise<PrestacaoConta> {
  return prestacaoContaRepository.criar({
    ...dados,
    status: 'PENDENTE',
  });
}

export function atualizarPrestacao(
  id: string,
  dados: DadosPrestacaoConta,
): Promise<PrestacaoConta | null> {
  return prestacaoContaRepository.atualizar(id, dados);
}

export function alterarStatusPrestacao(
  id: string,
  status: StatusPrestacao,
): Promise<PrestacaoConta | null> {
  return prestacaoContaRepository.alterarStatus(id, status);
}

export function excluirPrestacao(id: string): Promise<boolean> {
  return prestacaoContaRepository.excluir(id);
}
```

A regra de negócio visível nesta etapa está em `criarPrestacao`: o cliente não escolhe o status inicial; toda prestação nasce como `PENDENTE`. Nas demais operações, o service delega ao repository.

### 10. Validar as entradas com Zod

Crie `src/middlewares/validarPrestacaoConta.ts`:

```ts
import { NextFunction, Request, Response } from 'express';
import { z, ZodError } from 'zod';
import {
  ConsultaPrestacoes,
  CorpoStatus,
  DadosPrestacaoConta,
  ParametrosId,
} from '../tipos/prestacaoConta';

const esquemaDadosPrestacao = z
  .object({
    empresa: z.string().trim().min(1, 'Informe a empresa'),
    descricao: z.string().trim().min(1, 'Informe a descrição'),
    valor: z.number().positive('O valor deve ser maior que zero'),
    dataVencimento: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD'),
    notaFiscalBase64: z.string().min(1, 'Informe a nota fiscal'),
  })
  .strict();

const esquemaStatus = z
  .object({
    status: z.enum(['PENDENTE', 'RECEBIDA', 'CANCELADA']),
  })
  .strict();

const esquemaId = z.object({
  id: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'O id deve ter 24 caracteres hexadecimais'),
});

const esquemaConsulta = z
  .object({
    empresa: z.string().trim().min(1).optional(),
    status: z.enum(['PENDENTE', 'RECEBIDA', 'CANCELADA']).optional(),
  })
  .strict();

function responderErroValidacao(resposta: Response, erro: ZodError): void {
  resposta.status(400).json({
    mensagem: 'Dados da requisição inválidos',
    erros: erro.issues.map((item) => ({
      campo: item.path.join('.') || 'requisição',
      mensagem: item.message,
    })),
  });
}

export function validarDadosPrestacao(
  requisicao: Request<object, object, DadosPrestacaoConta>,
  resposta: Response,
  proximo: NextFunction,
): void {
  const resultado = esquemaDadosPrestacao.safeParse(requisicao.body);

  if (!resultado.success) {
    responderErroValidacao(resposta, resultado.error);
    return;
  }

  requisicao.body = resultado.data;
  proximo();
}

export function validarStatus(
  requisicao: Request<ParametrosId, object, CorpoStatus>,
  resposta: Response,
  proximo: NextFunction,
): void {
  const resultado = esquemaStatus.safeParse(requisicao.body);

  if (!resultado.success) {
    responderErroValidacao(resposta, resultado.error);
    return;
  }

  requisicao.body = resultado.data;
  proximo();
}

export function validarId(
  requisicao: Request<ParametrosId>,
  resposta: Response,
  proximo: NextFunction,
): void {
  const resultado = esquemaId.safeParse(requisicao.params);

  if (!resultado.success) {
    responderErroValidacao(resposta, resultado.error);
    return;
  }

  proximo();
}

export function validarConsulta(
  requisicao: Request<object, object, object, ConsultaPrestacoes>,
  resposta: Response,
  proximo: NextFunction,
): void {
  const resultado = esquemaConsulta.safeParse(requisicao.query);

  if (!resultado.success) {
    responderErroValidacao(resposta, resultado.error);
    return;
  }

  proximo();
}
```

O middleware rejeita dados inválidos antes do controller. O campo da nota fiscal exige apenas texto preenchido; ele ainda não tenta validar Base64 real.

**Checkpoint:** execute:

```bash
npm run build
```

### 11. Criar o controller

Crie `src/controllers/prestacaoContaController.ts`:

```ts
import { Request, Response } from 'express';
import {
  alterarStatusPrestacao,
  atualizarPrestacao,
  buscarPrestacao,
  criarPrestacao,
  excluirPrestacao,
  listarPrestacoes,
} from '../services/prestacaoContaService';
import {
  ConsultaPrestacoes,
  CorpoStatus,
  DadosPrestacaoConta,
  ParametrosId,
} from '../tipos/prestacaoConta';

function responderErroInterno(resposta: Response): void {
  resposta.status(500).json({ mensagem: 'Erro interno do servidor' });
}

export async function listar(
  requisicao: Request<object, object, object, ConsultaPrestacoes>,
  resposta: Response,
): Promise<void> {
  try {
    const { empresa, status } = requisicao.query;
    resposta.status(200).json(await listarPrestacoes(empresa, status));
  } catch (erro) {
    console.error(erro);
    responderErroInterno(resposta);
  }
}

export async function buscarPorId(
  requisicao: Request<ParametrosId>,
  resposta: Response,
): Promise<void> {
  try {
    const prestacao = await buscarPrestacao(requisicao.params.id);

    if (!prestacao) {
      resposta.status(404).json({ mensagem: 'Prestação não encontrada' });
      return;
    }

    resposta.status(200).json(prestacao);
  } catch (erro) {
    console.error(erro);
    responderErroInterno(resposta);
  }
}

export async function criar(
  requisicao: Request<object, object, DadosPrestacaoConta>,
  resposta: Response,
): Promise<void> {
  try {
    resposta.status(201).json(await criarPrestacao(requisicao.body));
  } catch (erro) {
    console.error(erro);
    responderErroInterno(resposta);
  }
}

export async function atualizar(
  requisicao: Request<ParametrosId, object, DadosPrestacaoConta>,
  resposta: Response,
): Promise<void> {
  try {
    const prestacao = await atualizarPrestacao(
      requisicao.params.id,
      requisicao.body,
    );

    if (!prestacao) {
      resposta.status(404).json({ mensagem: 'Prestação não encontrada' });
      return;
    }

    resposta.status(200).json(prestacao);
  } catch (erro) {
    console.error(erro);
    responderErroInterno(resposta);
  }
}

export async function alterarStatus(
  requisicao: Request<ParametrosId, object, CorpoStatus>,
  resposta: Response,
): Promise<void> {
  try {
    const prestacao = await alterarStatusPrestacao(
      requisicao.params.id,
      requisicao.body.status,
    );

    if (!prestacao) {
      resposta.status(404).json({ mensagem: 'Prestação não encontrada' });
      return;
    }

    resposta.status(200).json(prestacao);
  } catch (erro) {
    console.error(erro);
    responderErroInterno(resposta);
  }
}

export async function excluir(
  requisicao: Request<ParametrosId>,
  resposta: Response,
): Promise<void> {
  try {
    const excluiu = await excluirPrestacao(requisicao.params.id);

    if (!excluiu) {
      resposta.status(404).json({ mensagem: 'Prestação não encontrada' });
      return;
    }

    resposta.status(204).send();
  } catch (erro) {
    console.error(erro);
    responderErroInterno(resposta);
  }
}
```

O controller cuida de HTTP e aguarda o service. O tratamento ainda é local e simples; a centralização dos erros será feita na aula específica de boas práticas de API.

### 12. Criar as rotas

Crie `src/routes/prestacaoContaRotas.ts`:

```ts
import { Router } from 'express';
import {
  alterarStatus,
  atualizar,
  buscarPorId,
  criar,
  excluir,
  listar,
} from '../controllers/prestacaoContaController';
import {
  validarConsulta,
  validarDadosPrestacao,
  validarId,
  validarStatus,
} from '../middlewares/validarPrestacaoConta';

export const prestacaoContaRotas = Router();

prestacaoContaRotas.get('/', validarConsulta, listar);
prestacaoContaRotas.get('/:id', validarId, buscarPorId);
prestacaoContaRotas.post('/', validarDadosPrestacao, criar);
prestacaoContaRotas.put('/:id', validarId, validarDadosPrestacao, atualizar);
prestacaoContaRotas.patch(
  '/:id/status',
  validarId,
  validarStatus,
  alterarStatus,
);
prestacaoContaRotas.delete('/:id', validarId, excluir);
```

A ordem é importante: a requisição passa pelos middlewares indicados antes de chegar ao controller.

### 13. Configurar a conexão com o MongoDB

Crie `src/configuracoes/banco.ts`:

```ts
import mongoose from 'mongoose';

export async function conectarBanco(): Promise<void> {
  const url = process.env.MONGODB_URL;

  if (!url) {
    throw new Error('A variável MONGODB_URL não foi configurada');
  }

  await mongoose.connect(url);
  console.log('Conexão com o MongoDB estabelecida');
}
```

A função falha de forma explícita quando a URL não existe. O servidor só abrirá a porta depois que essa conexão for concluída.

### 14. Configurar o Swagger

Crie `src/configuracoes/swagger.ts`:

```ts
const corpoPrestacao = {
  type: 'object',
  required: [
    'empresa',
    'descricao',
    'valor',
    'dataVencimento',
    'notaFiscalBase64',
  ],
  properties: {
    empresa: { type: 'string', example: 'Empresa Exemplo Ltda.' },
    descricao: { type: 'string', example: 'Hospedagem em viagem de trabalho' },
    valor: { type: 'number', example: 350 },
    dataVencimento: { type: 'string', example: '2026-08-20' },
    notaFiscalBase64: { type: 'string', example: 'exemplo-temporario' },
  },
};

const parametroId = {
  in: 'path',
  name: 'id',
  required: true,
  schema: { type: 'string' },
};

export const documentacaoSwagger = {
  openapi: '3.0.0',
  info: {
    title: 'API de Prestação de Contas',
    version: '1.0.0',
  },
  servers: [{ url: 'http://localhost:3000' }],
  paths: {
    '/prestacoes-de-contas': {
      get: {
        summary: 'Lista as prestações',
        tags: ['Prestações de contas'],
        parameters: [
          { in: 'query', name: 'empresa', schema: { type: 'string' } },
          {
            in: 'query',
            name: 'status',
            schema: {
              type: 'string',
              enum: ['PENDENTE', 'RECEBIDA', 'CANCELADA'],
            },
          },
        ],
        responses: { '200': { description: 'Lista de prestações' } },
      },
      post: {
        summary: 'Cadastra uma prestação',
        tags: ['Prestações de contas'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: corpoPrestacao } },
        },
        responses: {
          '201': { description: 'Prestação cadastrada' },
          '400': { description: 'Dados inválidos' },
        },
      },
    },
    '/prestacoes-de-contas/{id}': {
      get: {
        summary: 'Consulta uma prestação',
        tags: ['Prestações de contas'],
        parameters: [parametroId],
        responses: {
          '200': { description: 'Prestação encontrada' },
          '400': { description: 'ID inválido' },
          '404': { description: 'Prestação não encontrada' },
        },
      },
      put: {
        summary: 'Atualiza os dados da prestação',
        tags: ['Prestações de contas'],
        parameters: [parametroId],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: corpoPrestacao } },
        },
        responses: {
          '200': { description: 'Prestação atualizada' },
          '400': { description: 'ID ou dados inválidos' },
          '404': { description: 'Prestação não encontrada' },
        },
      },
      delete: {
        summary: 'Exclui uma prestação',
        tags: ['Prestações de contas'],
        parameters: [parametroId],
        responses: {
          '204': { description: 'Prestação excluída' },
          '400': { description: 'ID inválido' },
          '404': { description: 'Prestação não encontrada' },
        },
      },
    },
    '/prestacoes-de-contas/{id}/status': {
      patch: {
        summary: 'Altera somente o status',
        tags: ['Prestações de contas'],
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
          '400': { description: 'ID ou status inválido' },
          '404': { description: 'Prestação não encontrada' },
        },
      },
    },
  },
};
```

O Swagger documenta o mesmo contrato implementado nas rotas. O identificador agora aparece como `string`, compatível com o MongoDB.

### 15. Montar a aplicação Express

Crie `src/app.ts`:

```ts
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { documentacaoSwagger } from './configuracoes/swagger';
import { prestacaoContaRotas } from './routes/prestacaoContaRotas';

export const app = express();

app.use(express.json({ limit: '5mb' }));
app.use('/documentacao', swaggerUi.serve, swaggerUi.setup(documentacaoSwagger));
app.use('/prestacoes-de-contas', prestacaoContaRotas);
```

Não há autenticação neste projeto. O limite de `5mb` apenas prepara o parser de JSON para o contrato existente; nenhum envio real de imagem será desenvolvido agora.

Crie `src/servidor.ts`:

```ts
import 'dotenv/config';
import { app } from './app';
import { conectarBanco } from './configuracoes/banco';

async function iniciarServidor(): Promise<void> {
  try {
    await conectarBanco();

    const porta = Number(process.env.PORTA ?? 3000);
    app.listen(porta, () => {
      console.log(`Servidor executando em http://localhost:${porta}`);
      console.log(`Swagger em http://localhost:${porta}/documentacao`);
    });
  } catch (erro) {
    console.error('Não foi possível iniciar a aplicação', erro);
    process.exit(1);
  }
}

void iniciarServidor();
```

`app.ts` configura o Express sem abrir porta. `servidor.ts` carrega o `.env`, conecta o banco e somente então inicia o servidor HTTP.

**Checkpoint:** formate e compile todo o projeto:

```bash
npm run formatar
npm run build
```

### 16. Executar e testar pelo Swagger

Confirme que o MongoDB está ativo:

```bash
docker compose ps
```

Inicie a API:

```bash
npm run dev
```

Abra `http://localhost:3000/documentacao`.

Na operação `POST /prestacoes-de-contas`, envie:

```json
{
  "empresa": "Empresa Exemplo Ltda.",
  "descricao": "Hospedagem em viagem de trabalho",
  "valor": 350,
  "dataVencimento": "2026-08-20",
  "notaFiscalBase64": "exemplo-temporario"
}
```

A resposta deve ter status `201`, um `id` textual e status `PENDENTE`. Copie o `id`, pois ele será usado nos próximos testes.

Execute, nesta ordem:

1. `GET /prestacoes-de-contas` para listar;
2. `GET /prestacoes-de-contas/{id}` para consultar;
3. `PUT /prestacoes-de-contas/{id}` para trocar os dados editáveis;
4. `PATCH /prestacoes-de-contas/{id}/status` com `{"status":"RECEBIDA"}`;
5. `DELETE /prestacoes-de-contas/{id}` para excluir.

**Checkpoint:** todas as operações devem responder sem erro, e uma consulta depois do `DELETE` deve retornar `404`.

### 17. Comprovar a persistência

Cadastre novamente uma prestação e pare a API com `Ctrl+C`. Inicie-a outra vez:

```bash
npm run dev
```

Liste as prestações. O registro deve continuar disponível porque não estava armazenado na memória do Node.js.

Agora pare a API, remova o container sem remover o volume e recrie-o:

```bash
docker compose down
docker compose up -d
docker compose ps
```

Inicie novamente a API e faça outro `GET /prestacoes-de-contas`. O registro deve permanecer, pois o volume `dados_mongodb` foi preservado.

Esse teste diferencia três ciclos de vida:

| Elemento reiniciado ou recriado | Onde o dado permanece |
| --- | --- |
| processo Node.js | MongoDB |
| container MongoDB | volume Docker |
| volume removido | o dado é perdido |

## Código completo

Todos os arquivos necessários foram apresentados no passo a passo. Antes da execução final, confira este fluxo:

```text
POST /prestacoes-de-contas
  → prestacaoContaRotas.post
  → validarDadosPrestacao
  → controller.criar
  → service.criarPrestacao
       regra: status inicial PENDENTE
  → repository.criar
  → PrestacaoContaModel.create
  → coleção prestacoes_contas no MongoDB
```

Faça também a verificação final:

```bash
npm run verificar-formatacao
npm run build
docker compose ps
```

Se os três comandos concluírem corretamente, abra o Swagger e repita pelo menos o cadastro e a listagem.

## Erros comuns

### `Cannot connect to the Docker daemon`

O Docker não está iniciado. Abra o Docker Desktop ou inicie o serviço do Docker no Linux e repita `docker compose up -d`.

### `port is already allocated`

Outro processo está usando a porta `27017`. Verifique containers ativos com `docker ps` e encerre apenas o serviço que você reconhece. Não crie dois MongoDB na mesma porta.

### `ECONNREFUSED 127.0.0.1:27017`

A API não conseguiu alcançar o banco. Confirme `docker compose ps`, confira a URL do `.env` e reinicie a API depois que o MongoDB estiver ativo.

### `A variável MONGODB_URL não foi configurada`

O `.env` não existe, está fora da raiz do backend ou usa outro nome de variável. O arquivo deve conter `MONGODB_URL=...` e `servidor.ts` deve importar `dotenv/config` antes de conectar.

### O identificador numérico antigo retorna `400`

O MongoDB usa ObjectId, como `66bd3aa9e1741bcbad7497c1`. Use o `id` devolvido pelo `POST`, não um número sequencial.

### O TypeScript informa erro no código do Zod

Confirme as versões instaladas com `npm list zod typescript`. Depois verifique se o código foi copiado integralmente e se o `package-lock.json` corresponde à instalação atual.

### O `PUT` altera o status sem intenção

O body do `PUT` deve conter somente os campos definidos em `DadosPrestacaoConta`. O status é alterado exclusivamente pelo `PATCH /:id/status`.

### Os dados desapareceram depois de usar Docker Compose

`docker compose down` preserva o volume. Já `docker compose down -v` remove o volume e os dados. Confira também se `compose.yaml` ainda monta `dados_mongodb:/data/db`.

### A API abre a porta mesmo quando o banco falha

Em `servidor.ts`, `await conectarBanco()` deve aparecer antes de `app.listen`. Essa ordem impede que a API aceite requisições sem possuir conexão com o banco.

## Resumo

Nesta aula, você construiu uma API completa a partir de uma pasta vazia e conectou todas as camadas:

```text
rota → middleware Zod → controller → service → repository → model → MongoDB
```

Você também:

* executou o MongoDB em um container;
* preservou os dados em um volume Docker;
* configurou a conexão por variável de ambiente;
* concentrou o acesso ao Mongoose no repository;
* manteve a regra de status inicial no service;
* implementou cadastro, listagem, consulta, atualização, alteração de status e exclusão;
* documentou e testou as rotas pelo Swagger;
* comprovou a persistência após reiniciar a API e recriar o container.

O array em memória deixou de ser necessário: agora o MongoDB é a fonte dos dados da aplicação.
