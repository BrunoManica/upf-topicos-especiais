# Aula 4 — Tutorial de CRUD persistido com MongoDB

## Objetivo da aula

Construir um CRUD persistido para o recurso da sua atividade, executando o MongoDB com Docker e implementando o fluxo completo:

```text
rota → middleware → controller → service → repository → model → MongoDB
```

Este tutorial retoma as camadas estudadas anteriormente, mas não repete suas explicações. O foco está em aplicar a mesma organização a um recurso diferente e substituir os dados em memória pela persistência no MongoDB.

## Resultado final

Ao concluir, sua API terá estas operações para o recurso da atividade:

| Método | Caminho | Resultado esperado |
| --- | --- | --- |
| `POST` | `/nome-plural-do-recurso` | cria um documento e retorna `201` |
| `GET` | `/nome-plural-do-recurso` | lista os documentos e retorna `200` |
| `GET` | `/nome-plural-do-recurso/:id` | consulta um documento e retorna `200` |
| `PUT` | `/nome-plural-do-recurso/:id` | atualiza os dados editáveis e retorna `200` |
| `DELETE` | `/nome-plural-do-recurso/:id` | exclui o documento e retorna `204` |

O Swagger ficará disponível em `http://localhost:3000/documentacao`. Os dados continuarão no banco após o reinício da API e após a recriação do container, desde que o volume seja preservado.

## Contexto

Cada equipe implementará um destes CRUDs do sistema:

1. usuário;
2. funcionário;
3. prestação de contas;
4. categoria de despesa;
5. forma de pagamento;
6. fornecedor;
7. viagem;
8. departamento, cargo e responsável.

Como cada equipe trabalha com um recurso diferente, o tutorial apresenta duas referências:

* um **molde genérico**, que mostra os pontos que precisam ser adaptados;
* um **exemplo real de prestação de contas**, com os campos `empresa`, `descricao`, `valor`, `dataVencimento` e `status`.

O exemplo resolve a estrutura da prestação de contas. A equipe responsável por esse CRUD pode segui-lo diretamente. As demais equipes devem usar a mesma organização, mas adaptar nomes, campos, tipos, validações, rota, coleção e documentação ao próprio recurso.

Se você está fazendo essa adaptação pela primeira vez, compare o molde e o exemplo real em cada camada antes de escrever a sua versão. Se já entendeu o padrão, trabalhe diretamente com o molde e consulte o exemplo real somente quando surgir uma dúvida.

Não crie arquivos chamados `entidade.ts` ou `entidadeModel.ts`. Crie os arquivos com o nome do recurso da sua equipe. Para prestação de contas, use os arquivos `prestacaoConta*.ts` apresentados no exemplo.

Antes do código, defina o contrato do seu recurso. Compare o molde e o exemplo:

| Decisão | Molde | Exemplo real |
| --- | --- | --- |
| singular em PascalCase | `Entidade` | `PrestacaoConta` |
| singular em camelCase | `entidade` | `prestacaoConta` |
| plural da rota em kebab-case | `entidades` | `prestacoes-de-contas` |
| coleção no MongoDB | `entidades` | `prestacoes_contas` |
| campos | texto, número e booleano | `empresa: string`, `descricao: string`, `valor: number`, `dataVencimento: string`, `status: string` |
| body válido | depende dos campos | `{"empresa":"Empresa Exemplo Ltda.","descricao":"almoço durante viagem","valor":85.50,"dataVencimento":"2026-08-20","status":"PENDENTE"}` |

Registre as mesmas seis decisões para o seu recurso. Em seguida, responda:

1. Quais nomes mudam entre arquivo, interface, variável, rota e coleção?
2. Quais campos são obrigatórios e como cada um será verificado em tempo de execução?
3. Qual JSON representa um cadastro válido do seu recurso?

Se essas respostas ainda não estiverem claras, não avance para o model. O mesmo contrato precisará aparecer nos tipos, no schema, no middleware e no Swagger.

## Explicação conceitual

O MongoDB armazena documentos dentro de coleções. O Mongoose conecta o backend ao MongoDB e oferece o schema e o model usados pelo repository.

```text
requisição HTTP
      ↓
rota → middleware → controller → service → repository → model Mongoose
                                                               ↓
                                                            MongoDB
```

| Parte | Responsabilidade neste tutorial |
| --- | --- |
| rota | relacionar método, caminho, middleware e controller |
| middleware | validar o body e o formato do `ObjectId` |
| controller | ler a requisição, chamar o service e construir a resposta HTTP |
| service | representar as operações do recurso e concentrar futuras regras |
| repository | executar as operações de persistência |
| model | definir o schema e a coleção do MongoDB |
| documentação | descrever o contrato do recurso no OpenAPI |

O CRUD desta atividade possui pouca regra de negócio. Por isso, o service será pequeno. Ainda assim, o controller não acessará o repository, e somente o repository importará o model.

As operações do banco são assíncronas. Portanto, repository, service e controller trabalharão com `Promise`, `async` e `await`.

## Preparação

Continue no backend usado nas aulas anteriores. No terminal, entre na raiz desse backend:

```bash
cd /caminho/para/o/projeto/backend
```

Todos os caminhos deste tutorial são relativos a essa pasta. Por exemplo, `src/models/meuRecursoModel.ts` significa:

```text
backend/
└── src/
    └── models/
        └── meuRecursoModel.ts
```

Confira as ferramentas:

```bash
node --version
npm --version
docker --version
docker compose version
```

Na raiz do backend, instale as dependências de persistência. Se o Swagger da Aula 3 já estiver instalado, o npm apenas confirmará a dependência:

```bash
npm install mongoose@8 dotenv@17 swagger-ui-express@5
npm install --save-dev @types/swagger-ui-express@4
```

Crie as pastas que ainda não existem.

No Linux ou macOS:

```bash
mkdir -p src/configuracoes src/controllers src/documentacao src/middlewares src/models src/repositories src/routes src/services src/tipos
```

No Windows PowerShell:

```powershell
$pastas = 'configuracoes','controllers','documentacao','middlewares','models','repositories','routes','services','tipos'
$pastas | ForEach-Object { New-Item "src/$_" -ItemType Directory -Force }
```

## Passo a passo

### 1. Executar o MongoDB com Docker

Na raiz do backend, crie o arquivo `compose.yaml` com este conteúdo completo:

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

O caminho do arquivo é:

```text
backend/
└── compose.yaml
```

A imagem fixa a versão do MongoDB. A porta publicada permite que a API executada na sua máquina acesse o banco. O volume `dados_mongodb` preserva os arquivos do banco fora do ciclo de vida do container.

Ainda na raiz do backend, inicie o MongoDB:

```bash
docker compose up -d
```

Confira o estado:

```bash
docker compose ps
```

O serviço `mongodb` deve aparecer em execução. Se isso não acontecer, consulte os logs:

```bash
docker compose logs mongodb
```

Para parar e remover o container sem remover os dados:

```bash
docker compose down
```

Não use `docker compose down -v` nesta atividade. A opção `-v` também remove o volume.

### 2. Configurar o ambiente

Na raiz do backend, crie somente o arquivo `.env`:

```text
MONGODB_URL=mongodb://127.0.0.1:27017/prestacao_contas
PORTA=3000
```

O caminho do arquivo é:

```text
backend/
└── .env
```

Todos os recursos pertencem ao mesmo sistema e usam o banco `prestacao_contas`. A URL contém `127.0.0.1` porque a API roda na sua máquina e acessa a porta publicada pelo container.

### 3. Criar a conexão com o banco

Crie `src/configuracoes/banco.ts`, relativo à raiz do backend:

```ts
import mongoose from 'mongoose';

export async function conectarBanco(): Promise<void> {
  const url = process.env.MONGODB_URL;

  if (!url) {
    throw new Error('MONGODB_URL não foi definida');
  }

  await mongoose.connect(url);
  console.log('MongoDB conectado');
}
```

Esse arquivo é compartilhado por todos os recursos. Não crie uma conexão para cada CRUD.

### 4. Escolher os nomes dos arquivos do recurso

Os arquivos específicos seguem este padrão:

```text
src/
├── controllers/
│   └── nomeDoRecursoController.ts
├── documentacao/
│   └── nomeDoRecursoDocumentacao.ts
├── middlewares/
│   └── validarNomeDoRecurso.ts
├── models/
│   └── nomeDoRecursoModel.ts
├── repositories/
│   └── nomeDoRecursoRepository.ts
├── routes/
│   └── nomeDoRecursoRotas.ts
├── services/
│   └── nomeDoRecursoService.ts
└── tipos/
    └── nomeDoRecurso.ts
```

Substitua `nomeDoRecurso` antes de criar os arquivos. No exemplo de prestação de contas, os caminhos são `src/tipos/prestacaoConta.ts`, `src/models/prestacaoContaModel.ts` e assim por diante. A equipe desse CRUD pode usar esses nomes; as demais equipes criam os equivalentes do próprio recurso.

### 5. Implementar os tipos

No seu backend, crie `src/tipos/nomeDoRecurso.ts`. Use o molde para localizar os pontos de adaptação.

#### Molde genérico de `src/tipos/nomeDoRecurso.ts`

```ts
export interface DadosEntidade {
  campoTexto: string;
  campoNumero: number;
  campoBooleano: boolean;
}

export interface EntidadeResposta extends DadosEntidade {
  id: string;
}

export interface ParametrosId {
  id: string;
}
```

O nome da interface deve representar o recurso. Os campos devem reproduzir o contrato da atividade, não os três marcadores do molde.

#### Exemplo real de `src/tipos/prestacaoConta.ts`

```ts
export interface DadosPrestacaoConta {
  empresa: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  status: string;
}

export interface PrestacaoContaResposta extends DadosPrestacaoConta {
  id: string;
}

export interface ParametrosId {
  id: string;
}
```

Antes de seguir, compare a sua interface com o body válido definido no início. Todo campo obrigatório aparece nos dois lugares? Um número continua sendo número no JSON ou foi colocado entre aspas?

### 6. Implementar o model

No seu backend, crie `src/models/nomeDoRecursoModel.ts`.

#### Molde genérico de `src/models/nomeDoRecursoModel.ts`

```ts
import { Schema, model } from 'mongoose';
import { DadosEntidade } from '../tipos/nomeDoRecurso';

const entidadeSchema = new Schema<DadosEntidade>(
  {
    campoTexto: {
      type: String,
      required: true,
    },
    campoNumero: {
      type: Number,
      required: true,
    },
    campoBooleano: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const EntidadeModelo = model<DadosEntidade>(
  'Entidade',
  entidadeSchema,
  'entidades',
);
```

O terceiro argumento de `model` define o nome exato da coleção. Não use automaticamente o plural sugerido pelo Mongoose: escreva a coleção definida no contrato.

#### Exemplo real de `src/models/prestacaoContaModel.ts`

```ts
import { Schema, model } from 'mongoose';
import { DadosPrestacaoConta } from '../tipos/prestacaoConta';

const prestacaoContaSchema = new Schema<DadosPrestacaoConta>(
  {
    empresa: {
      type: String,
      required: true,
    },
    descricao: {
      type: String,
      required: true,
    },
    valor: {
      type: Number,
      required: true,
    },
    dataVencimento: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const PrestacaoContaModelo = model<DadosPrestacaoConta>(
  'PrestacaoConta',
  prestacaoContaSchema,
  'prestacoes_contas',
);
```

Confira três correspondências no seu código: tipo `string` usa `String`, tipo `number` usa `Number` e tipo `boolean` usa `Boolean`. Essas palavras têm capitalização diferente porque, no schema, representam os tipos do Mongoose.

Se o contrato tiver um campo opcional, mantenha essa decisão em todas as representações. Por exemplo, `observacao?: string` no TypeScript corresponde a `required: false` no Mongoose; o middleware aceita `undefined` ou um texto válido; `paraResposta` copia `observacao: documento.observacao`; e o Swagger descreve a propriedade, mas não inclui `observacao` no array `required`.

### 7. Implementar o repository

No seu backend, crie `src/repositories/nomeDoRecursoRepository.ts`.

#### Molde genérico de `src/repositories/nomeDoRecursoRepository.ts`

```ts
import { EntidadeModelo } from '../models/nomeDoRecursoModel';
import {
  DadosEntidade,
  EntidadeResposta,
} from '../tipos/nomeDoRecurso';

function paraResposta(documento: {
  _id: unknown;
  campoTexto: string;
  campoNumero: number;
  campoBooleano: boolean;
}): EntidadeResposta {
  return {
    id: String(documento._id),
    campoTexto: documento.campoTexto,
    campoNumero: documento.campoNumero,
    campoBooleano: documento.campoBooleano,
  };
}

export async function criar(
  dados: DadosEntidade,
): Promise<EntidadeResposta> {
  const documento = await EntidadeModelo.create(dados);
  return paraResposta(documento);
}

export async function listar(): Promise<EntidadeResposta[]> {
  const documentos = await EntidadeModelo.find();
  return documentos.map(paraResposta);
}

export async function buscarPorId(
  id: string,
): Promise<EntidadeResposta | null> {
  const documento = await EntidadeModelo.findById(id);
  return documento ? paraResposta(documento) : null;
}

export async function atualizar(
  id: string,
  dados: DadosEntidade,
): Promise<EntidadeResposta | null> {
  const documento = await EntidadeModelo.findByIdAndUpdate(id, dados, {
    new: true,
    runValidators: true,
  });

  return documento ? paraResposta(documento) : null;
}

export async function excluir(id: string): Promise<boolean> {
  const documento = await EntidadeModelo.findByIdAndDelete(id);
  return documento !== null;
}
```

#### Exemplo real de `src/repositories/prestacaoContaRepository.ts`

```ts
import { PrestacaoContaModelo } from '../models/prestacaoContaModel';
import {
  DadosPrestacaoConta,
  PrestacaoContaResposta,
} from '../tipos/prestacaoConta';

function paraResposta(documento: {
  _id: unknown;
  empresa: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  status: string;
}): PrestacaoContaResposta {
  return {
    id: String(documento._id),
    empresa: documento.empresa,
    descricao: documento.descricao,
    valor: documento.valor,
    dataVencimento: documento.dataVencimento,
    status: documento.status,
  };
}

export async function criar(
  dados: DadosPrestacaoConta,
): Promise<PrestacaoContaResposta> {
  const documento = await PrestacaoContaModelo.create(dados);
  return paraResposta(documento);
}

export async function listar(): Promise<PrestacaoContaResposta[]> {
  const documentos = await PrestacaoContaModelo.find();
  return documentos.map(paraResposta);
}

export async function buscarPorId(
  id: string,
): Promise<PrestacaoContaResposta | null> {
  const documento = await PrestacaoContaModelo.findById(id);
  return documento ? paraResposta(documento) : null;
}

export async function atualizar(
  id: string,
  dados: DadosPrestacaoConta,
): Promise<PrestacaoContaResposta | null> {
  const documento = await PrestacaoContaModelo.findByIdAndUpdate(id, dados, {
    new: true,
    runValidators: true,
  });

  return documento ? paraResposta(documento) : null;
}

export async function excluir(id: string): Promise<boolean> {
  const documento = await PrestacaoContaModelo.findByIdAndDelete(id);
  return documento !== null;
}
```

No seu repository, `paraResposta` precisa copiar todos os campos do recurso. Se um campo existe no schema e não aparece nessa função, ele será persistido, mas desaparecerá da resposta da API.

### 8. Implementar o service

No seu backend, crie `src/services/nomeDoRecursoService.ts`.

#### Molde genérico de `src/services/nomeDoRecursoService.ts`

```ts
import * as entidadeRepository from '../repositories/nomeDoRecursoRepository';
import {
  DadosEntidade,
  EntidadeResposta,
} from '../tipos/nomeDoRecurso';

export function criar(dados: DadosEntidade): Promise<EntidadeResposta> {
  return entidadeRepository.criar(dados);
}

export function listar(): Promise<EntidadeResposta[]> {
  return entidadeRepository.listar();
}

export function buscarPorId(
  id: string,
): Promise<EntidadeResposta | null> {
  return entidadeRepository.buscarPorId(id);
}

export function atualizar(
  id: string,
  dados: DadosEntidade,
): Promise<EntidadeResposta | null> {
  return entidadeRepository.atualizar(id, dados);
}

export function excluir(id: string): Promise<boolean> {
  return entidadeRepository.excluir(id);
}
```

#### Exemplo real de `src/services/prestacaoContaService.ts`

```ts
import * as prestacaoContaRepository from '../repositories/prestacaoContaRepository';
import {
  DadosPrestacaoConta,
  PrestacaoContaResposta,
} from '../tipos/prestacaoConta';

export function criar(
  dados: DadosPrestacaoConta,
): Promise<PrestacaoContaResposta> {
  return prestacaoContaRepository.criar(dados);
}

export function listar(): Promise<PrestacaoContaResposta[]> {
  return prestacaoContaRepository.listar();
}

export function buscarPorId(
  id: string,
): Promise<PrestacaoContaResposta | null> {
  return prestacaoContaRepository.buscarPorId(id);
}

export function atualizar(
  id: string,
  dados: DadosPrestacaoConta,
): Promise<PrestacaoContaResposta | null> {
  return prestacaoContaRepository.atualizar(id, dados);
}

export function excluir(id: string): Promise<boolean> {
  return prestacaoContaRepository.excluir(id);
}
```

Neste CRUD, o service apenas encaminha as operações. Não invente regras para preencher a camada. Se o contrato da atividade definir uma regra, ela será implementada aqui, não no controller nem no repository.

### 9. Implementar os middlewares de validação

No seu backend, crie `src/middlewares/validarNomeDoRecurso.ts`. A validação será feita manualmente no middleware.

#### Molde genérico de `src/middlewares/validarNomeDoRecurso.ts`

```ts
import { NextFunction, Request, Response } from 'express';
import {
  DadosEntidade,
  ParametrosId,
} from '../tipos/nomeDoRecurso';

export function validarCorpo(
  requisicao: Request<object, object, DadosEntidade>,
  resposta: Response,
  proximo: NextFunction,
): void {
  const corpo = requisicao.body;

  if (
    !corpo ||
    typeof corpo !== 'object' ||
    Array.isArray(corpo) ||
    typeof corpo.campoTexto !== 'string' ||
    corpo.campoTexto.trim().length === 0 ||
    typeof corpo.campoNumero !== 'number' ||
    !Number.isFinite(corpo.campoNumero) ||
    typeof corpo.campoBooleano !== 'boolean'
  ) {
    resposta.status(400).json({ mensagem: 'Corpo da requisição inválido' });
    return;
  }

  proximo();
}

export function validarId(
  requisicao: Request<ParametrosId>,
  resposta: Response,
  proximo: NextFunction,
): void {
  if (!/^[0-9a-fA-F]{24}$/.test(requisicao.params.id)) {
    resposta.status(400).json({ mensagem: 'Identificador inválido' });
    return;
  }

  proximo();
}
```

#### Exemplo real de `src/middlewares/validarPrestacaoConta.ts`

```ts
import { NextFunction, Request, Response } from 'express';
import {
  DadosPrestacaoConta,
  ParametrosId,
} from '../tipos/prestacaoConta';

export function validarCorpoPrestacaoConta(
  requisicao: Request<object, object, DadosPrestacaoConta>,
  resposta: Response,
  proximo: NextFunction,
): void {
  const corpo = requisicao.body;

  if (
    !corpo ||
    typeof corpo !== 'object' ||
    Array.isArray(corpo) ||
    typeof corpo.empresa !== 'string' ||
    corpo.empresa.trim().length === 0 ||
    typeof corpo.descricao !== 'string' ||
    corpo.descricao.trim().length === 0 ||
    typeof corpo.valor !== 'number' ||
    !Number.isFinite(corpo.valor) ||
    typeof corpo.dataVencimento !== 'string' ||
    corpo.dataVencimento.trim().length === 0 ||
    typeof corpo.status !== 'string' ||
    corpo.status.trim().length === 0
  ) {
    resposta.status(400).json({ mensagem: 'Corpo da requisição inválido' });
    return;
  }

  proximo();
}

export function validarIdPrestacaoConta(
  requisicao: Request<ParametrosId>,
  resposta: Response,
  proximo: NextFunction,
): void {
  if (!/^[0-9a-fA-F]{24}$/.test(requisicao.params.id)) {
    resposta.status(400).json({ mensagem: 'Identificador inválido' });
    return;
  }

  proximo();
}
```

O primeiro `if` confirma que existe um objeto no body e verifica diretamente cada campo. A expressão regular aceita somente identificadores com os 24 caracteres hexadecimais usados pelo MongoDB. No seu middleware, adapte essas verificações aos tipos e à obrigatoriedade dos seus próprios campos; um body inválido deve ser interrompido antes do controller.

### 10. Implementar o controller

No seu backend, crie `src/controllers/nomeDoRecursoController.ts`.

#### Molde genérico de `src/controllers/nomeDoRecursoController.ts`

```ts
import { Request, Response } from 'express';
import * as entidadeService from '../services/nomeDoRecursoService';
import { DadosEntidade, ParametrosId } from '../tipos/nomeDoRecurso';

export async function criar(
  requisicao: Request<object, object, DadosEntidade>,
  resposta: Response,
): Promise<void> {
  const entidade = await entidadeService.criar(requisicao.body);
  resposta.status(201).json(entidade);
}

export async function listar(
  _requisicao: Request,
  resposta: Response,
): Promise<void> {
  const entidades = await entidadeService.listar();
  resposta.status(200).json(entidades);
}

export async function buscarPorId(
  requisicao: Request<ParametrosId>,
  resposta: Response,
): Promise<void> {
  const entidade = await entidadeService.buscarPorId(requisicao.params.id);

  if (!entidade) {
    resposta.status(404).json({ mensagem: 'Registro não encontrado' });
    return;
  }

  resposta.status(200).json(entidade);
}

export async function atualizar(
  requisicao: Request<ParametrosId, object, DadosEntidade>,
  resposta: Response,
): Promise<void> {
  const entidade = await entidadeService.atualizar(
    requisicao.params.id,
    requisicao.body,
  );

  if (!entidade) {
    resposta.status(404).json({ mensagem: 'Registro não encontrado' });
    return;
  }

  resposta.status(200).json(entidade);
}

export async function excluir(
  requisicao: Request<ParametrosId>,
  resposta: Response,
): Promise<void> {
  const excluiu = await entidadeService.excluir(requisicao.params.id);

  if (!excluiu) {
    resposta.status(404).json({ mensagem: 'Registro não encontrado' });
    return;
  }

  resposta.status(204).send();
}
```

#### Exemplo real de `src/controllers/prestacaoContaController.ts`

```ts
import { Request, Response } from 'express';
import * as prestacaoContaService from '../services/prestacaoContaService';
import {
  DadosPrestacaoConta,
  ParametrosId,
} from '../tipos/prestacaoConta';

export async function criar(
  requisicao: Request<object, object, DadosPrestacaoConta>,
  resposta: Response,
): Promise<void> {
  const prestacaoConta = await prestacaoContaService.criar(requisicao.body);
  resposta.status(201).json(prestacaoConta);
}

export async function listar(
  _requisicao: Request,
  resposta: Response,
): Promise<void> {
  const prestacoesContas = await prestacaoContaService.listar();
  resposta.status(200).json(prestacoesContas);
}

export async function buscarPorId(
  requisicao: Request<ParametrosId>,
  resposta: Response,
): Promise<void> {
  const prestacaoConta = await prestacaoContaService.buscarPorId(
    requisicao.params.id,
  );

  if (!prestacaoConta) {
    resposta.status(404).json({ mensagem: 'Prestação de contas não encontrada' });
    return;
  }

  resposta.status(200).json(prestacaoConta);
}

export async function atualizar(
  requisicao: Request<ParametrosId, object, DadosPrestacaoConta>,
  resposta: Response,
): Promise<void> {
  const prestacaoConta = await prestacaoContaService.atualizar(
    requisicao.params.id,
    requisicao.body,
  );

  if (!prestacaoConta) {
    resposta.status(404).json({ mensagem: 'Prestação de contas não encontrada' });
    return;
  }

  resposta.status(200).json(prestacaoConta);
}

export async function excluir(
  requisicao: Request<ParametrosId>,
  resposta: Response,
): Promise<void> {
  const excluiu = await prestacaoContaService.excluir(requisicao.params.id);

  if (!excluiu) {
    resposta.status(404).json({ mensagem: 'Prestação de contas não encontrada' });
    return;
  }

  resposta.status(204).send();
}
```

Observe que o controller não verifica tipos do body nem o formato do identificador. Essas verificações já foram executadas pelos middlewares.

### 11. Implementar as rotas

No seu backend, crie `src/routes/nomeDoRecursoRotas.ts`.

#### Molde genérico de `src/routes/nomeDoRecursoRotas.ts`

```ts
import { Router } from 'express';
import * as entidadeController from '../controllers/nomeDoRecursoController';
import {
  validarCorpo,
  validarId,
} from '../middlewares/validarNomeDoRecurso';

export const entidadeRotas = Router();

entidadeRotas.post('/', validarCorpo, entidadeController.criar);
entidadeRotas.get('/', entidadeController.listar);
entidadeRotas.get('/:id', validarId, entidadeController.buscarPorId);
entidadeRotas.put(
  '/:id',
  validarId,
  validarCorpo,
  entidadeController.atualizar,
);
entidadeRotas.delete('/:id', validarId, entidadeController.excluir);
```

#### Exemplo real de `src/routes/prestacaoContaRotas.ts`

```ts
import { Router } from 'express';
import * as prestacaoContaController from '../controllers/prestacaoContaController';
import {
  validarCorpoPrestacaoConta,
  validarIdPrestacaoConta,
} from '../middlewares/validarPrestacaoConta';

export const prestacaoContaRotas = Router();

prestacaoContaRotas.post(
  '/',
  validarCorpoPrestacaoConta,
  prestacaoContaController.criar,
);
prestacaoContaRotas.get('/', prestacaoContaController.listar);
prestacaoContaRotas.get(
  '/:id',
  validarIdPrestacaoConta,
  prestacaoContaController.buscarPorId,
);
prestacaoContaRotas.put(
  '/:id',
  validarIdPrestacaoConta,
  validarCorpoPrestacaoConta,
  prestacaoContaController.atualizar,
);
prestacaoContaRotas.delete(
  '/:id',
  validarIdPrestacaoConta,
  prestacaoContaController.excluir,
);
```

Em `POST`, valide o body. Nas operações com `:id`, valide o identificador. Em `PUT`, os dois middlewares precisam ser executados antes do controller.

### 12. Documentar o recurso no Swagger

No seu backend, crie `src/documentacao/nomeDoRecursoDocumentacao.ts`. Cada recurso exportará seus schemas e paths. Essa separação permite integrar a documentação sem uma equipe substituir as rotas documentadas por outra.

#### Molde genérico de `src/documentacao/nomeDoRecursoDocumentacao.ts`

```ts
export const entidadeSchemas = {
  DadosEntidade: {
    type: 'object',
    required: ['campoTexto', 'campoNumero', 'campoBooleano'],
    properties: {
      campoTexto: { type: 'string', example: 'Texto de exemplo' },
      campoNumero: { type: 'number', example: 100 },
      campoBooleano: { type: 'boolean', example: true },
    },
  },
  EntidadeResposta: {
    allOf: [
      { $ref: '#/components/schemas/DadosEntidade' },
      {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66bd3aa9e1741bcbad7497c1' },
        },
      },
    ],
  },
};

export const entidadeCaminhos = {
  '/entidades': {
    post: {
      tags: ['Entidades'],
      summary: 'Cadastrar entidade',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/DadosEntidade' },
          },
        },
      },
      responses: {
        '201': {
          description: 'Entidade cadastrada',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EntidadeResposta' },
            },
          },
        },
        '400': { description: 'Corpo inválido' },
      },
    },
    get: {
      tags: ['Entidades'],
      summary: 'Listar entidades',
      responses: {
        '200': {
          description: 'Lista de entidades',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/EntidadeResposta' },
              },
            },
          },
        },
      },
    },
  },
  '/entidades/{id}': {
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          pattern: '^[0-9a-fA-F]{24}$',
        },
      },
    ],
    get: {
      tags: ['Entidades'],
      summary: 'Consultar entidade',
      responses: {
        '200': {
          description: 'Entidade encontrada',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EntidadeResposta' },
            },
          },
        },
        '400': { description: 'Identificador inválido' },
        '404': { description: 'Entidade não encontrada' },
      },
    },
    put: {
      tags: ['Entidades'],
      summary: 'Atualizar entidade',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/DadosEntidade' },
          },
        },
      },
      responses: {
        '200': {
          description: 'Entidade atualizada',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EntidadeResposta' },
            },
          },
        },
        '400': { description: 'Identificador ou corpo inválido' },
        '404': { description: 'Entidade não encontrada' },
      },
    },
    delete: {
      tags: ['Entidades'],
      summary: 'Excluir entidade',
      responses: {
        '204': { description: 'Entidade excluída' },
        '400': { description: 'Identificador inválido' },
        '404': { description: 'Entidade não encontrada' },
      },
    },
  },
};
```

#### Exemplo real de `src/documentacao/prestacaoContaDocumentacao.ts`

```ts
export const prestacaoContaSchemas = {
  DadosPrestacaoConta: {
    type: 'object',
    required: [
      'empresa',
      'descricao',
      'valor',
      'dataVencimento',
      'status',
    ],
    properties: {
      empresa: { type: 'string', example: 'Empresa Exemplo Ltda.' },
      descricao: { type: 'string', example: 'almoço durante viagem' },
      valor: { type: 'number', example: 85.5 },
      dataVencimento: {
        type: 'string',
        format: 'date',
        example: '2026-08-20',
      },
      status: {
        type: 'string',
        example: 'PENDENTE',
      },
    },
  },
  PrestacaoContaResposta: {
    allOf: [
      { $ref: '#/components/schemas/DadosPrestacaoConta' },
      {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66bd3aa9e1741bcbad7497c1' },
        },
      },
    ],
  },
};

export const prestacaoContaCaminhos = {
  '/prestacoes-de-contas': {
    post: {
      tags: ['Prestações de contas'],
      summary: 'Cadastrar prestação de contas',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/DadosPrestacaoConta' },
          },
        },
      },
      responses: {
        '201': {
          description: 'Prestação de contas cadastrada',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PrestacaoContaResposta',
              },
            },
          },
        },
        '400': { description: 'Corpo inválido' },
      },
    },
    get: {
      tags: ['Prestações de contas'],
      summary: 'Listar prestações de contas',
      responses: {
        '200': {
          description: 'Lista de prestações de contas',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/PrestacaoContaResposta',
                },
              },
            },
          },
        },
      },
    },
  },
  '/prestacoes-de-contas/{id}': {
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          pattern: '^[0-9a-fA-F]{24}$',
        },
      },
    ],
    get: {
      tags: ['Prestações de contas'],
      summary: 'Consultar prestação de contas',
      responses: {
        '200': {
          description: 'Prestação de contas encontrada',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PrestacaoContaResposta',
              },
            },
          },
        },
        '400': { description: 'Identificador inválido' },
        '404': { description: 'Prestação de contas não encontrada' },
      },
    },
    put: {
      tags: ['Prestações de contas'],
      summary: 'Atualizar prestação de contas',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/DadosPrestacaoConta' },
          },
        },
      },
      responses: {
        '200': {
          description: 'Prestação de contas atualizada',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PrestacaoContaResposta',
              },
            },
          },
        },
        '400': { description: 'Identificador ou corpo inválido' },
        '404': { description: 'Prestação de contas não encontrada' },
      },
    },
    delete: {
      tags: ['Prestações de contas'],
      summary: 'Excluir prestação de contas',
      responses: {
        '204': { description: 'Prestação de contas excluída' },
        '400': { description: 'Identificador inválido' },
        '404': { description: 'Prestação de contas não encontrada' },
      },
    },
  },
};
```

No seu arquivo, adapte em conjunto os nomes dos schemas, os `$ref`, as propriedades, a lista `required`, os paths e as tags. Um `$ref` com nome diferente do schema exportado quebra a documentação mesmo que a API continue funcionando.

### 13. Agregar a documentação do Swagger

O agregador é compartilhado. Uma pessoa deve atualizar `src/configuracoes/swagger.ts`, relativo à raiz do backend, preservando os imports e objetos dos recursos já integrados.

#### Agregador com o molde genérico em `src/configuracoes/swagger.ts`

```ts
import {
  entidadeCaminhos,
  entidadeSchemas,
} from '../documentacao/nomeDoRecursoDocumentacao';

export const documentacaoSwagger = {
  openapi: '3.0.3',
  info: {
    title: 'API de Prestação de Contas',
    version: '1.0.0',
  },
  servers: [{ url: 'http://localhost:3000' }],
  paths: {
    ...entidadeCaminhos,
  },
  components: {
    schemas: {
      ...entidadeSchemas,
    },
  },
};
```

#### Agregador com o exemplo real em `src/configuracoes/swagger.ts`

```ts
import {
  prestacaoContaCaminhos,
  prestacaoContaSchemas,
} from '../documentacao/prestacaoContaDocumentacao';

export const documentacaoSwagger = {
  openapi: '3.0.3',
  info: {
    title: 'API de Prestação de Contas',
    version: '1.0.0',
  },
  servers: [{ url: 'http://localhost:3000' }],
  paths: {
    ...prestacaoContaCaminhos,
  },
  components: {
    schemas: {
      ...prestacaoContaSchemas,
    },
  },
};
```

Quando houver mais de um recurso, não substitua o conteúdo de `paths` ou `schemas`. Acrescente os novos imports e espalhe cada objeto:

```ts
paths: {
  ...recursoExistenteCaminhos,
  ...novoRecursoCaminhos,
},
components: {
  schemas: {
    ...recursoExistenteSchemas,
    ...novoRecursoSchemas,
  },
},
```

Cada recurso deve usar nomes de schemas e paths exclusivos. Antes de integrar, verifique se o path do seu recurso já existe no agregador.

### 14. Registrar o recurso e o Swagger no aplicativo

O arquivo `src/app.ts`, relativo à raiz do backend, é compartilhado. Atualize-o sem apagar rotas existentes.

#### Registro com o molde genérico em `src/app.ts`

```ts
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { documentacaoSwagger } from './configuracoes/swagger';
import { entidadeRotas } from './routes/nomeDoRecursoRotas';

export const app = express();

app.use(express.json());
app.use(
  '/documentacao',
  swaggerUi.serve,
  swaggerUi.setup(documentacaoSwagger),
);
app.use('/entidades', entidadeRotas);
```

#### Registro com o exemplo real em `src/app.ts`

```ts
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { documentacaoSwagger } from './configuracoes/swagger';
import { prestacaoContaRotas } from './routes/prestacaoContaRotas';

export const app = express();

app.use(express.json());
app.use(
  '/documentacao',
  swaggerUi.serve,
  swaggerUi.setup(documentacaoSwagger),
);
app.use('/prestacoes-de-contas', prestacaoContaRotas);
```

No projeto da turma, `express.json()` e `/documentacao` devem aparecer uma vez. Cada recurso acrescenta apenas seu import e seu `app.use`.

Antes de seguir, compare três lugares no seu código: o path do Swagger, o primeiro argumento de `app.use` e a URL usada nos testes. Os três precisam usar o mesmo plural em kebab-case.

### 15. Conectar o banco antes de iniciar o servidor

Atualize o arquivo compartilhado `src/servidor.ts`, relativo à raiz do backend:

```ts
import 'dotenv/config';
import { app } from './app';
import { conectarBanco } from './configuracoes/banco';

const porta = Number(process.env.PORTA ?? 3000);

async function iniciarServidor(): Promise<void> {
  await conectarBanco();

  app.listen(porta, () => {
    console.log(`Servidor executando em http://localhost:${porta}`);
  });
}

iniciarServidor().catch((erro: unknown) => {
  console.error('Não foi possível iniciar a aplicação', erro);
  process.exit(1);
});
```

A conexão acontece antes de `app.listen`. Se o MongoDB não estiver acessível, a API não abre a porta HTTP como se estivesse pronta.

### 16. Revisar a adaptação

Não procure apenas erros de digitação. Verifique se o mesmo contrato atravessa todas as camadas:

```text
body do Swagger
      ↓
middleware → tipos → model → repository → resposta do controller
```

Use uma busca pelos marcadores do molde:

```bash
rg -n "Entidade|entidade|entidades|campoTexto|campoNumero|campoBooleano|nomeDoRecurso" src
```

Os arquivos do seu recurso não devem conter os marcadores genéricos. A equipe de prestação de contas pode manter os nomes `PrestacaoConta` e `prestacaoConta`; as demais equipes devem substituí-los pelos nomes do próprio recurso.

Compile o backend:

```bash
npm run build
```

### 17. Executar e testar pelo Swagger

Na raiz do backend, confirme o banco e inicie a API:

```bash
docker compose ps
npm run dev
```

Acesse:

```text
http://localhost:3000/documentacao
```

Teste as operações na seguinte sequência:

1. envie um `POST` com o body válido do seu recurso e guarde o `id`. Para prestação de contas, use:

    ```json
    {
      "empresa": "Empresa Exemplo Ltda.",
      "descricao": "almoço durante viagem",
      "valor": 85.50,
      "dataVencimento": "2026-08-20",
      "status": "PENDENTE"
    }
    ```

2. liste com `GET` e localize o documento criado;
3. consulte o mesmo documento pelo `id`;
4. altere todos os campos editáveis com `PUT`;
5. envie um body com tipo incorreto e confirme o status `400`;
6. use `abc` como identificador e confirme o status `400`;
7. exclua o documento e confirme o status `204` sem corpo;
8. consulte novamente o mesmo `id` e confirme o status `404`.

Para comprovar a persistência, crie outro documento, interrompa somente `npm run dev`, inicie a API novamente e repita a listagem. Depois, execute `docker compose down`, suba o container novamente e confirme que o documento continua disponível.

## Código completo

O código completo está distribuído no passo a passo porque cada camada precisa ser adaptada antes da próxima. Ao terminar, seu módulo deve conter:

```text
src/
├── controllers/
│   └── nomeRealDoRecursoController.ts
├── documentacao/
│   └── nomeRealDoRecursoDocumentacao.ts
├── middlewares/
│   └── validarNomeRealDoRecurso.ts
├── models/
│   └── nomeRealDoRecursoModel.ts
├── repositories/
│   └── nomeRealDoRecursoRepository.ts
├── routes/
│   └── nomeRealDoRecursoRotas.ts
├── services/
│   └── nomeRealDoRecursoService.ts
└── tipos/
    └── nomeRealDoRecurso.ts
```

Além desses arquivos, o backend compartilha `compose.yaml`, `.env`, `src/configuracoes/banco.ts`, `src/configuracoes/swagger.ts`, `src/app.ts` e `src/servidor.ts`.

## Erros comuns

### O MongoDB não aparece em `docker compose ps`

Execute `docker compose logs mongodb`. Confirme que o Docker está iniciado e que a porta `27017` não está ocupada por outro processo.

### A aplicação informa que `MONGODB_URL` não foi definida

Confirme que `.env` está na raiz do backend, que a variável está escrita exatamente como `MONGODB_URL` e que `src/servidor.ts` começa com `import 'dotenv/config';`.

### O model grava na coleção errada

Confira o terceiro argumento de `model`. Rota em kebab-case e coleção com sublinhado são nomes diferentes e ocupam lugares diferentes.

### Um `ObjectId` inválido chega ao repository

Confirme que as rotas com `:id` executam o middleware `validarId` antes do controller. A validação não deve estar dentro do controller.

### O body inválido chega ao controller

Confirme que `POST` e `PUT` executam o middleware de validação do corpo. Depois, compare os campos do middleware com os tipos e o model.

### O campo foi salvo, mas não aparece na resposta

Revise a função `paraResposta` no repository. Ela deve copiar todos os campos que a API devolve.

### O Swagger mostra um erro de referência

Compare o nome exportado em `schemas` com cada `$ref`. A grafia depois de `#/components/schemas/` deve ser idêntica.

### A integração removeu rotas ou documentação existente

`src/app.ts` e `src/configuracoes/swagger.ts` são arquivos compartilhados. Acrescente imports, `app.use`, caminhos e schemas; não substitua o conteúdo criado por outra equipe.

### Os dados desapareceram depois de remover o container

Confira o volume em `compose.yaml`. `docker compose down` preserva o volume; `docker compose down -v` o remove.

## Resumo

Neste tutorial, você executou o MongoDB em um container, preservou seus dados em um volume, configurou `.env` e conectou o Mongoose antes de iniciar o servidor.

Depois, implementou tipos, model, repository, service, middlewares, controller, rotas e documentação modular do Swagger. O molde mostrou os pontos de adaptação e a prestação de contas demonstrou um resultado coerente. A equipe desse CRUD pode seguir o exemplo; as demais precisam manter a estrutura e adaptar o contrato ao próprio recurso.

O CRUD está concluído quando as cinco operações funcionam pelo Swagger, bodies e identificadores inválidos retornam `400`, registros inexistentes retornam `404`, a exclusão retorna `204` e os dados permanecem após reiniciar a API e recriar o container sem apagar o volume.
