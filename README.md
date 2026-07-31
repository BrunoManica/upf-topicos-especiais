# Aula 1 — Da primeira rota à organização em camadas

Nesta aula construiremos uma API Express com TypeScript em duas fases. Primeiro faremos tudo em um único arquivo para entender o essencial. Depois moveremos o código para rota e controller, quando a separação passar a fazer sentido.

O caminho que queremos compreender é:

```text
requisição GET / → Express → função que responde → JSON
```

## 1. Criar o projeto

Na pasta onde você guarda seus projetos, execute cada linha e observe o que aparece antes de continuar:

```bash
mkdir backend-inicial
cd backend-inicial
npm init -y
```

`npm init -y` cria o `package.json`, a ficha do projeto. É nela que o npm registra bibliotecas e comandos.

Agora instale o Express, que receberá as requisições HTTP:

```bash
npm install express
```

Em seguida, instale as ferramentas para desenvolver com TypeScript:

```bash
npm install -D typescript tsx @types/express
```

O `-D` indica dependências de desenvolvimento. `typescript` verifica nosso código, `tsx` executa arquivos `.ts` e `@types/express` fornece os tipos do Express.

## 2. Configurar TypeScript

Gere o arquivo de configuração:

```bash
npx tsc --init
```

Depois abra `tsconfig.json` e substitua seu conteúdo por:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "Node16",
    "moduleResolution": "Node16",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

O arquivo gerado pelo comando é genérico. Nós o ajustamos para informar que o código ficará em `src` e a compilação sairá em `dist`. `Node16` é usado porque as versões atuais do TypeScript não aceitam mais `moduleResolution: "Node"`.

Sem terminal, basta criar manualmente o arquivo `tsconfig.json` e escrever a mesma configuração.

## 3. Primeiro servidor: tudo em um arquivo

Antes de criar pastas e dividir responsabilidades, vamos provar que uma API funciona.

Crie a pasta `src` e, dentro dela, o arquivo `servidor.ts`. No VS Code, use **Nova Pasta** e **Novo Arquivo**. Pelo terminal, seria:

```bash
mkdir src
touch src/servidor.ts
```

No `src/servidor.ts`, escreva:

```ts
import express from 'express';

const app = express();
const porta = 3000;

app.get('/', (_requisicao, resposta) => {
  resposta.status(200).json({ mensagem: 'Hello World!' });
});

app.listen(porta, () => {
  console.log(`Servidor rodando em http://localhost:${porta}`);
});
```

Leia esse código de baixo para cima: `listen` abre a porta; `app.get` diz o que fazer para a URL `/`; e `json` envia a resposta. Neste momento, está tudo no mesmo arquivo de propósito — temos apenas uma rota e é fácil enxergar o fluxo.

## 4. Executar a primeira rota

No `package.json`, substitua a seção `scripts` por:

```json
"scripts": {
  "dev": "tsx watch src/servidor.ts",
  "build": "tsc",
  "start": "node dist/servidor.js"
}
```

Se preferir editar pelo terminal, os mesmos scripts são criados com:

```bash
npm pkg set scripts.dev="tsx watch src/servidor.ts"
npm pkg set scripts.build="tsc"
npm pkg set scripts.start="node dist/servidor.js"
```

Agora valide primeiro o TypeScript e depois a API:

```bash
npm run build
npm start
```

Em outro terminal, execute:

```bash
curl http://localhost:3000/
```

O resultado precisa ser:

```json
{ "mensagem": "Hello World!" }
```

Se chegou até aqui, o Express já está funcionando. Só agora vamos organizar o código.

## 5. Por que tirar a rota do servidor?

Se colocarmos produtos, pedidos e usuários no `servidor.ts`, ele vira um arquivo grande e difícil de navegar. A primeira separação é colocar URLs em `routes`.

Crie `src/routes/rotas.ts`. Inicialmente, mova para ele a definição da rota:

```ts
import { Router } from 'express';

export const rotas = Router();

rotas.get('/', (_requisicao, resposta) => {
  resposta.status(200).json({ mensagem: 'Hello World!' });
});
```

Agora altere `src/servidor.ts`. Remova o bloco `app.get(...)`, importe `rotas` e registre-as:

```ts
import express from 'express';
import { rotas } from './routes/rotas';

const app = express();
const porta = 3000;

app.use(express.json());
app.use(rotas);

app.listen(porta, () => {
  console.log(`Servidor rodando em http://localhost:${porta}`);
});
```

O servidor continua responsável por iniciar a aplicação. A pasta `routes` fica responsável por decidir qual função atende cada endereço.

## 6. Criar o controller

A rota ainda contém a regra de resposta. Em uma API maior, cada rota pode precisar buscar dados, validar informações e montar respostas. Essa lógica fica no controller.

Crie `src/controllers/helloController.ts`:

```ts
import { Request, Response } from 'express';

export function helloController(_requisicao: Request, resposta: Response): void {
  resposta.status(200).json({ mensagem: 'Hello World!' });
}
```

Por fim, simplifique `src/routes/rotas.ts` para apenas encaminhar a URL ao controller:

```ts
import { Router } from 'express';
import { helloController } from '../controllers/helloController';

export const rotas = Router();

rotas.get('/', helloController);
```

Agora a arquitetura ficou assim:

```text
servidor.ts  → cria Express, registra rotas e abre a porta
rotas.ts     → associa GET / ao controller
controller   → produz a resposta JSON
```

## 7. Validar a versão organizada

Pare o servidor anterior com `Ctrl + C` e execute novamente:

```bash
npm run build
npm start
```

Teste outra vez `GET /` com navegador ou `curl`. A resposta deve ser a mesma, mas o código agora está preparado para receber novas rotas sem transformar o servidor em um arquivo enorme.

No desenvolvimento diário, use `npm run dev`: o `watch` reinicia o servidor quando você salva um arquivo.

## 8. Ler informação da própria URL: path parameter

Nem toda rota é fixa. Quando queremos identificar um recurso na URL, usamos um **path parameter**. Por exemplo, em `GET /informacoes/42`, o valor `42` é o parâmetro `codigo`.

No controller, adicione esta função em `src/controllers/helloController.ts`:

```ts
export function buscarInformacao(
  request: Request<{ codigo: string }>,
  response: Response,
): void {
  const { codigo } = request.params;

  response.status(200).json({
    mensagem: `Informação solicitada: ${codigo}`,
  });
}
```

`request.params` contém os valores presentes na URL. O tipo `Request<{ codigo: string }>` deixa explícito para o TypeScript que existe um parâmetro chamado `codigo`.

Em `src/routes/rotas.ts`, importe `buscarInformacao` e adicione a rota:

```ts
rotas.get('/informacoes/:codigo', buscarInformacao);
```

Os dois pontos em `:codigo` significam “este trecho da URL é variável”. Teste com:

```bash
curl http://localhost:3000/informacoes/42
```

A resposta será:

```json
{ "mensagem": "Informação solicitada: 42" }
```

## 9. Receber dados no corpo: POST com JSON

Um `POST` normalmente é usado quando o cliente envia dados para a API criar ou processar algo. Diferentemente do path parameter, esses dados vêm no **corpo da requisição** (`body`).

No mesmo controller, adicione:

```ts
interface NovaMensagem {
  texto: string;
}

export function criarMensagem(
  request: Request<object, object, NovaMensagem>,
  response: Response,
): void {
  const { texto } = request.body;

  response.status(201).json({
    mensagem: 'Mensagem recebida com sucesso!',
    texto,
  });
}
```

O tipo `NovaMensagem` descreve o formato que esperamos receber. `request.body` contém o JSON enviado. Usamos o status `201` porque a API recebeu e criou uma nova mensagem.

Em `src/routes/rotas.ts`, importe `criarMensagem` e adicione:

```ts
rotas.post('/mensagens', criarMensagem);
```

O `app.use(express.json())`, que já está em `servidor.ts`, é o que permite ao Express interpretar o corpo JSON. Sem ele, `request.body` não seria preenchido.

Com o servidor em execução, teste assim:

```bash
curl -X POST http://localhost:3000/mensagens \
  -H "Content-Type: application/json" \
  -d '{"texto":"Olá, API!"}'
```

Resposta esperada:

```json
{
  "mensagem": "Mensagem recebida com sucesso!",
  "texto": "Olá, API!"
}
```

## Desafio

Adicione `GET /saudacao/:nome`, retornando uma saudação com o nome recebido na URL. Antes de escrever, responda: qual arquivo recebe a URL e qual arquivo define a resposta?
