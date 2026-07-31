# Aula 1 — Node.js, Express e a primeira API HTTP

## Objetivo da aula

Criar e executar o primeiro backend em Node.js com Express e TypeScript. Ao final, a aplicação responde requisições HTTP, lê um parâmetro da URL e recebe dados enviados no corpo de uma requisição.

## Contexto

O frontend de um sistema não acessa diretamente as regras e os dados da aplicação. Ele faz uma requisição para uma API, e o backend decide como responder.

Nesta primeira versão, vamos usar uma situação simples: consultar dados de uma pessoa pelo CPF e enviar uma prestação de contas. Mesmo sem salvar nada, já é possível enxergar a conversa entre cliente e servidor.

## Explicação conceitual

Node.js permite executar JavaScript no servidor. O Express é uma biblioteca que recebe requisições HTTP e nos ajuda a definir o que cada endereço da API deve fazer. TypeScript acrescenta tipos ao JavaScript, ajudando a encontrar erros antes de executar o programa.

Uma requisição possui, entre outras coisas:

* um método HTTP, como `GET` ou `POST`;
* uma URL, como `/buscar-por-cpf/123`;
* parâmetros na URL, quando necessários;
* um corpo com dados, normalmente em JSON, nos envios com `POST`.

O servidor devolve uma resposta com um status HTTP e, neste projeto, um JSON. Por exemplo, `200` indica que uma consulta foi atendida e `201` indica que um recurso foi criado.

## Passo a passo

### 1. Criar a pasta do backend

Na raiz em que você guarda seus projetos, crie a pasta `backend` e entre nela.

No Linux ou macOS:

```bash
mkdir backend
cd backend
```

No Windows, pelo Prompt de Comando ou PowerShell:

```powershell
mkdir backend
cd backend
```

Agora inicialize um projeto Node.js. O comando cria o arquivo `package.json`, que registra as dependências e os comandos do projeto.

```bash
npm init -y
```

### 2. Instalar as dependências

Instale o Express para criar a API e as dependências de desenvolvimento para trabalhar com TypeScript:

```bash
npm install express
npm install -D typescript tsx @types/express
```

Cada pacote tem uma responsabilidade:

* `express`: cria a API HTTP;
* `typescript`: permite escrever o backend em arquivos `.ts`;
* `tsx`: executa TypeScript no desenvolvimento e reinicia o servidor ao salvar;
* `@types/express`: adiciona ao TypeScript os tipos usados pelo Express.

Configure os comandos de execução no `package.json`:

```bash
npm pkg set scripts.dev="tsx watch src/servidor.ts"
npm pkg set scripts.build="tsc"
npm pkg set scripts.start="node dist/servidor.js"
```

### 3. Criar a estrutura de pastas e arquivos

Dentro de `backend`, crie a estrutura abaixo. As rotas ficam separadas dos controllers para facilitar a localização de cada parte da aplicação.

```text
backend/
├── src/
│   ├── controllers/
│   │   ├── helloController.ts
│   │   ├── prestacaoContasController.ts
│   │   └── usariosController.ts
│   ├── routes/
│   │   └── router.ts
│   └── servidor.ts
├── package.json
└── tsconfig.json
```

No Linux ou macOS, os diretórios podem ser criados assim:

```bash
mkdir -p src/controllers src/routes
touch src/servidor.ts
touch src/controllers/helloController.ts
touch src/controllers/prestacaoContasController.ts
touch src/controllers/usariosController.ts
touch src/routes/router.ts
```

No Windows PowerShell, use:

```powershell
mkdir src, src/controllers, src/routes
New-Item src/servidor.ts -ItemType File
New-Item src/controllers/helloController.ts -ItemType File
New-Item src/controllers/prestacaoContasController.ts -ItemType File
New-Item src/controllers/usariosController.ts -ItemType File
New-Item src/routes/router.ts -ItemType File
```

Crie também o arquivo `tsconfig.json` na raiz de `backend`. Ele informa ao TypeScript onde está o código-fonte e onde deve ficar a versão compilada.

### 4. Configurar o TypeScript

Em `tsconfig.json`, escreva:

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "node16",
    "moduleResolution": "node16",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

`rootDir` indica que os arquivos escritos por nós ficam em `src`. Quando executarmos a compilação, `outDir` define que os arquivos JavaScript serão criados em `dist`.

### 5. Iniciar o servidor

O arquivo `src/servidor.ts` cria a aplicação Express, habilita a leitura de JSON, registra as rotas e inicia o servidor na porta `3000`.

```ts
import express from 'express'
import { rotas } from './routes/router';

const app = express();
const porta = 3000;

app.use(express.json())
app.use(rotas)

app.listen(porta, () => {
    console.log(`servidor rodando em http://localhost:${porta}`)
})
```

`express.json()` precisa aparecer antes das rotas. Ele interpreta um corpo JSON recebido no `POST` e o disponibiliza em `requisicao.body`.

Depois de criar todos os arquivos desta aula, execute o projeto com:

```bash
npm run dev
```

O terminal deve mostrar `servidor rodando em http://localhost:3000`. Enquanto esse comando estiver aberto, o `tsx` reinicia o servidor quando você salvar uma alteração.

### 6. Centralizar as rotas

Em `src/routes/router.ts`, o `Router` reúne os endereços da API. Cada rota aponta para uma função controller.

```ts
import { Router } from "express";
import { helloController } from "../controllers/helloController";
import { buscarPorCpf } from "../controllers/usariosController";
import { salvar } from "../controllers/prestacaoContasController";

export const rotas = Router();

rotas.get("/", helloController)
rotas.get("/buscar-por-cpf/:cpf", buscarPorCpf)
rotas.post("/salvar-prestacao-contas/", salvar)
```

O trecho `:cpf` é um parâmetro de rota. Se a URL for `/buscar-por-cpf/12345678900`, o valor `12345678900` estará em `requisicao.params.cpf`.

### 7. Responder a uma rota simples

O controller em `src/controllers/helloController.ts` recebe a requisição e devolve um JSON.

```ts
import { Request, Response } from "express";

export function helloController(_requisicao: Request, resposta: Response): void {
    resposta.status(200).json({ mensagem: "oi bruno" })
}
```

O sublinhado em `_requisicao` indica que a requisição existe porque o Express a entrega para a função, mas ela não é usada nesta rota. O `Response` é usado para definir o status e enviar o JSON.

### 8. Ler um parâmetro da URL

O controller `src/controllers/usariosController.ts` lê o CPF enviado na URL e o usa na resposta.

```ts
import { Request, Response } from "express";

export function buscarPorCpf(
    requisicao: Request<{ cpf: string }>,
    resposta: Response
): void {
    const { cpf } = requisicao.params

    resposta.status(200).json({
        nome: "fulano de tal",
        cpf: cpf,
        contasPrestadas: [
            {
                id: 1,
                nomeGasto: "ao mossar",
                data: "2026-07-28",
                valor: 998.99,
                status: "REJEITADO"
            }
        ]
    })
}
```

`Request<{ cpf: string }>` informa ao TypeScript que a rota possui um parâmetro chamado `cpf`. Os dados usados neste exemplo permitem visualizar como o parâmetro recebido pode compor uma resposta JSON.

### 9. Receber dados no corpo de uma requisição

Em `src/controllers/prestacaoContasController.ts`, a interface descreve os dados esperados no corpo. O controller exibe o objeto no terminal e retorna `201`.

```ts
import { Response, Request } from "express";

interface prestacaoConta {
    nomeGasto: string,
    data: string,
    valor: number,
    arquivo: string
}

export function salvar(
    requisicao: Request<object, object, prestacaoConta>,
    resposta: Response
) {
    const prestacaoConta = requisicao.body;
    console.log(prestacaoConta)

    resposta.status(201).json({
        mensagem: "conta criada com sucesso"
    })
}
```

O terceiro tipo de `Request` representa o corpo da requisição. Por enquanto, `console.log` permite verificar no terminal o que chegou ao servidor. Nesta aula, a informação não é persistida.

## Código completo

Estrutura criada nesta etapa:

```text
backend/
├── src/
│   ├── controllers/
│   │   ├── helloController.ts
│   │   ├── prestacaoContasController.ts
│   │   └── usariosController.ts
│   ├── routes/
│   │   └── router.ts
│   └── servidor.ts
├── package.json
└── tsconfig.json
```

Os códigos completos dos arquivos foram apresentados no passo a passo e correspondem ao backend desenvolvido nesta aula.

O `package.json` usado para executar os comandos é:

```json
{
  "name": "backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/servidor.ts",
    "build": "tsc",
    "start": "node dist/servidor.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "express": "^5.2.1"
  },
  "devDependencies": {
    "@types/express": "^5.0.6",
    "tsx": "^4.23.1",
    "typescript": "^7.0.2"
  }
}
```

E o `tsconfig.json` define que os arquivos de `src` serão compilados para `dist`:

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "node16",
    "moduleResolution": "node16",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

## Testando a API

Com `npm run dev` em execução, abra outro terminal e teste as rotas.

```bash
curl http://localhost:3000/
```

Resposta esperada:

```json
{ "mensagem": "oi bruno" }
```

Para enviar um CPF na URL:

```bash
curl http://localhost:3000/buscar-por-cpf/12345678900
```

Para enviar uma prestação de contas:

```bash
curl -X POST http://localhost:3000/salvar-prestacao-contas/ \
  -H "Content-Type: application/json" \
  -d '{"nomeGasto":"Almoço","data":"2026-07-28","valor":45.90,"arquivo":"recibo.pdf"}'
```

No terminal do servidor, o objeto recebido será exibido. A resposta será:

```json
{ "mensagem": "conta criada com sucesso" }
```

## Erros comuns

* **A porta 3000 já está em uso:** finalize o outro processo que está usando a porta ou altere `const porta = 3000`.
* **`Cannot GET /...`:** confira o método HTTP e a URL. `GET /buscar-por-cpf/:cpf` precisa receber um CPF no final da URL.
* **`requisicao.body` está vazio:** confira se `app.use(express.json())` está antes de `app.use(rotas)` e se o cabeçalho é `Content-Type: application/json`.
* **O comando `npm run dev` não inicia:** execute `npm install` dentro de `backend` antes de tentar novamente.

## Resumo

Nesta aula, criamos uma API Express com TypeScript, organizamos rotas e controllers, respondemos um `GET`, lemos um parâmetro de URL e recebemos um JSON com `POST`.
