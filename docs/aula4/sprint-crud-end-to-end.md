# Dinamica — CRUDs end-to-end do sistema de prestação de contas

Esta Dinamica simula a distribuição de demandas de um sistema empresarial. Cada task deve ser implementada como um módulo independente, com persistência no MongoDB e documentação no Swagger.

Em todas as tasks, preserve o fluxo:

```text
Request HTTP
  → Route
  → Middleware
  → Controller
  → Service
  → Repository
  → Model
  → MongoDB
```

Na volta, o resultado deve percorrer as mesmas responsabilidades até a `Response HTTP`. O middleware valida manualmente o body e, quando houver `:id`, confirma que o identificador possui 24 caracteres hexadecimais. Não use bibliotecas adicionais de validação.

# TASK 01 — CRUD de usuários

## Contexto

O usuário representa uma pessoa que possui acesso ao sistema empresarial de lançamento e prestação de contas. Nesta task, perfil e situação ativa são apenas dados cadastrais. Não implemente login nem controle de acesso.

## História

Como responsável pelo cadastro do sistema,
quero manter os dados dos usuários,
para registrar quem poderá utilizar a aplicação.

## Objetivo

Implementar um CRUD independente de usuários, persistido no MongoDB, com validação manual por middleware e cinco operações documentadas no Swagger.

## Modelo de dados esperado

| Campo | Tipo | Obrigatório | Exemplo |
| --- | --- | --- | --- |
| `nome` | string | sim | `Mariana Costa` |
| `email` | string | sim | `mariana.costa@empresa.com` |
| `senha` | string | sim | `senhaInicial123` |
| `perfil` | string | sim | `FINANCEIRO` |
| `ativo` | boolean | sim | `true` |

`perfil` aceita somente `FUNCIONARIO` ou `FINANCEIRO`. A senha é apenas um campo textual nesta atividade.

## Endpoints

### POST

- Método: `POST`
- Rota: `/usuarios`
- Parâmetros: nenhum
- Body: `nome`, `email`, `senha`, `perfil` e `ativo`
- Status esperado: `201 Created`; `400 Bad Request` para body inválido

Exemplo de request:

```json
{
  "nome": "Mariana Costa",
  "email": "mariana.costa@empresa.com",
  "senha": "senhaInicial123",
  "perfil": "FINANCEIRO",
  "ativo": true
}
```

Exemplo de response:

```json
{
  "id": "66c47aa12ea87f8123456701",
  "nome": "Mariana Costa",
  "email": "mariana.costa@empresa.com",
  "senha": "senhaInicial123",
  "perfil": "FINANCEIRO",
  "ativo": true
}
```

### GET

- Método: `GET`
- Rota: `/usuarios`
- Parâmetros: nenhum
- Body: não possui
- Status esperado: `200 OK`

Exemplo de request: `GET /usuarios`

Exemplo de response:

```json
[
  {
    "id": "66c47aa12ea87f8123456701",
    "nome": "Mariana Costa",
    "email": "mariana.costa@empresa.com",
    "senha": "senhaInicial123",
    "perfil": "FINANCEIRO",
    "ativo": true
  }
]
```

### GET por ID

- Método: `GET`
- Rota: `/usuarios/:id`
- Parâmetros: `id` no caminho
- Body: não possui
- Status esperado: `200 OK`; `400 Bad Request` para ID inválido; `404 Not Found` para usuário inexistente

Exemplo de request: `GET /usuarios/66c47aa12ea87f8123456701`

Exemplo de response:

```json
{
  "id": "66c47aa12ea87f8123456701",
  "nome": "Mariana Costa",
  "email": "mariana.costa@empresa.com",
  "senha": "senhaInicial123",
  "perfil": "FINANCEIRO",
  "ativo": true
}
```

### PUT

- Método: `PUT`
- Rota: `/usuarios/:id`
- Parâmetros: `id` no caminho
- Body: todos os campos do usuário
- Status esperado: `200 OK`; `400 Bad Request` para ID ou body inválido; `404 Not Found` para usuário inexistente

Exemplo de request:

```json
{
  "nome": "Mariana Costa",
  "email": "mariana.costa@empresa.com",
  "senha": "novaSenha456",
  "perfil": "FINANCEIRO",
  "ativo": false
}
```

Exemplo de response:

```json
{
  "id": "66c47aa12ea87f8123456701",
  "nome": "Mariana Costa",
  "email": "mariana.costa@empresa.com",
  "senha": "novaSenha456",
  "perfil": "FINANCEIRO",
  "ativo": false
}
```

### DELETE

- Método: `DELETE`
- Rota: `/usuarios/:id`
- Parâmetros: `id` no caminho
- Body: não possui
- Status esperado: `204 No Content`; `400 Bad Request` para ID inválido; `404 Not Found` para usuário inexistente

Exemplo de request: `DELETE /usuarios/66c47aa12ea87f8123456701`

Exemplo de response: resposta sem body.

## Validações

- `nome`, `email`, `senha` e `perfil` devem ser strings preenchidas.
- `ativo` deve ser booleano.
- `perfil` deve ser `FUNCIONARIO` ou `FINANCEIRO`.
- O `id` deve possuir 24 caracteres hexadecimais.
- O middleware deve interromper bodies e IDs inválidos com status `400`.

## Fluxo esperado

```text
/usuarios → middleware de usuário → controller de usuário
→ service de usuário → repository de usuário → model/coleção de usuários → MongoDB
```

O controller trata HTTP, o service conduz as operações e o repository concentra todo acesso ao model.

## Critérios de aceite

- [ ] Deve ser possível cadastrar e persistir um usuário com todos os campos definidos.
- [ ] O perfil deve aceitar apenas `FUNCIONARIO` ou `FINANCEIRO`.
- [ ] A listagem deve devolver um array, inclusive quando estiver vazio.
- [ ] A consulta individual deve utilizar o `id` gerado pelo MongoDB.
- [ ] A atualização deve permitir alterar os dados cadastrais e a situação ativa.
- [ ] A exclusão bem-sucedida deve retornar `204` sem body.
- [ ] IDs e bodies inválidos devem ser barrados por middleware.
- [ ] As cinco operações devem estar disponíveis e executáveis no Swagger.
- [ ] Controller, service e repository devem manter suas responsabilidades.
- [ ] O módulo não deve implementar login nem verificar permissões pelo perfil.

## Critérios de recusa

A task será recusada se alguma operação do CRUD faltar, se os usuários forem armazenados somente em memória, se o perfil aceitar qualquer valor, se a validação estiver concentrada no controller, se o controller acessar o MongoDB, se o Swagger não apresentar as cinco operações ou se o módulo implementar controle de acesso não solicitado.

# TASK 02 — CRUD de funcionários

## Contexto

O funcionário é a pessoa da empresa que realiza despesas e lançamentos. Cargo e departamento são textos do próprio cadastro para que esta task não dependa da estrutura organizacional da Task 08.

## História

Como responsável administrativo,
quero cadastrar os funcionários da empresa,
para identificar quem realiza despesas corporativas.

## Objetivo

Implementar o CRUD persistido de funcionários com contrato HTTP próprio e sem consultar outras collections.

## Modelo de dados esperado

| Campo | Tipo | Obrigatório | Exemplo |
| --- | --- | --- | --- |
| `nome` | string | sim | `Carlos Souza` |
| `cpf` | string | sim | `123.456.789-00` |
| `email` | string | sim | `carlos.souza@empresa.com` |
| `cargo` | string | sim | `Consultor comercial` |
| `departamento` | string | sim | `Comercial` |
| `ativo` | boolean | sim | `true` |

## Endpoints

### POST

- Método: `POST`
- Rota: `/funcionarios`
- Parâmetros: nenhum
- Body: todos os campos do funcionário
- Status esperado: `201 Created`; `400 Bad Request` para body inválido

Exemplo de request:

```json
{
  "nome": "Carlos Souza",
  "cpf": "123.456.789-00",
  "email": "carlos.souza@empresa.com",
  "cargo": "Consultor comercial",
  "departamento": "Comercial",
  "ativo": true
}
```

Exemplo de response:

```json
{
  "id": "66c47aa12ea87f8123456702",
  "nome": "Carlos Souza",
  "cpf": "123.456.789-00",
  "email": "carlos.souza@empresa.com",
  "cargo": "Consultor comercial",
  "departamento": "Comercial",
  "ativo": true
}
```

### GET

- Método: `GET`
- Rota: `/funcionarios`
- Parâmetros: nenhum
- Body: não possui
- Status esperado: `200 OK`

Exemplo de request: `GET /funcionarios`

Exemplo de response:

```json
[
  {
    "id": "66c47aa12ea87f8123456702",
    "nome": "Carlos Souza",
    "cpf": "123.456.789-00",
    "email": "carlos.souza@empresa.com",
    "cargo": "Consultor comercial",
    "departamento": "Comercial",
    "ativo": true
  }
]
```

### GET por ID

- Método: `GET`
- Rota: `/funcionarios/:id`
- Parâmetros: `id` no caminho
- Body: não possui
- Status esperado: `200 OK`; `400 Bad Request` para ID inválido; `404 Not Found` para funcionário inexistente

Exemplo de request: `GET /funcionarios/66c47aa12ea87f8123456702`

Exemplo de response:

```json
{
  "id": "66c47aa12ea87f8123456702",
  "nome": "Carlos Souza",
  "cpf": "123.456.789-00",
  "email": "carlos.souza@empresa.com",
  "cargo": "Consultor comercial",
  "departamento": "Comercial",
  "ativo": true
}
```

### PUT

- Método: `PUT`
- Rota: `/funcionarios/:id`
- Parâmetros: `id` no caminho
- Body: todos os campos do funcionário
- Status esperado: `200 OK`; `400 Bad Request` para ID ou body inválido; `404 Not Found` para funcionário inexistente

Exemplo de request:

```json
{
  "nome": "Carlos Souza",
  "cpf": "123.456.789-00",
  "email": "carlos.souza@empresa.com",
  "cargo": "Gerente comercial",
  "departamento": "Comercial",
  "ativo": true
}
```

Exemplo de response:

```json
{
  "id": "66c47aa12ea87f8123456702",
  "nome": "Carlos Souza",
  "cpf": "123.456.789-00",
  "email": "carlos.souza@empresa.com",
  "cargo": "Gerente comercial",
  "departamento": "Comercial",
  "ativo": true
}
```

### DELETE

- Método: `DELETE`
- Rota: `/funcionarios/:id`
- Parâmetros: `id` no caminho
- Body: não possui
- Status esperado: `204 No Content`; `400 Bad Request` para ID inválido; `404 Not Found` para funcionário inexistente

Exemplo de request: `DELETE /funcionarios/66c47aa12ea87f8123456702`

Exemplo de response: resposta sem body.

## Validações

- `nome`, `cpf`, `email`, `cargo` e `departamento` devem ser strings preenchidas.
- `ativo` deve ser booleano.
- O `id` deve possuir 24 caracteres hexadecimais.
- POST e PUT devem passar pelo middleware de validação do body.

## Fluxo esperado

```text
/funcionarios → middleware de funcionário → controller de funcionário
→ service de funcionário → repository de funcionário → model/coleção de funcionários → MongoDB
```

Cargo e departamento são persistidos diretamente como strings, sem busca externa.

## Critérios de aceite

- [ ] O cadastro deve persistir nome, CPF, email, cargo, departamento e situação ativa.
- [ ] Cargo e departamento devem permanecer campos textuais do funcionário.
- [ ] Deve ser possível listar e consultar funcionários após reiniciar a API.
- [ ] Um funcionário existente deve poder ser atualizado integralmente.
- [ ] A exclusão deve remover somente o documento informado.
- [ ] ID malformado deve retornar `400` antes do controller.
- [ ] ID válido inexistente deve retornar `404` sem erro inesperado.
- [ ] O Swagger deve mostrar parâmetros, bodies e respostas das cinco operações.
- [ ] Somente o repository deve acessar o model do MongoDB.

## Critérios de recusa

A task será recusada se depender da Task 08, criar relacionamento por identificador, dividir cargo e departamento em collections, não persistir no MongoDB, omitir campos do retorno, aceitar strings vazias, misturar responsabilidades das camadas ou deixar qualquer endpoint fora do Swagger.

# TASK 03 — CRUD de prestações de contas

## Contexto

A prestação de contas registra uma despesa realizada por um funcionário. No sistema real, o financeiro analisaria o lançamento, mas nesta Dinamica o status é somente um campo manipulado pelo CRUD. Não implemente fluxo de aprovação nem controle de acesso.

## História

Como funcionário da empresa,
quero registrar uma prestação de contas,
para informar ao financeiro uma despesa realizada.

## Objetivo

Implementar o CRUD persistido de prestações de contas, com validação de valor e status e dados relacionados representados por textos simples.

## Modelo de dados esperado

| Campo | Tipo | Obrigatório | Exemplo |
| --- | --- | --- | --- |
| `descricao` | string | sim | `Hospedagem durante viagem` |
| `valor` | number | sim | `480` |
| `data` | string | sim | `2026-08-19` |
| `funcionario` | string | sim | `João da Silva` |
| `categoria` | string | sim | `Hospedagem` |
| `formaPagamento` | string | sim | `Cartão corporativo` |
| `status` | string | sim | `PENDENTE` |

O status aceita `PENDENTE`, `APROVADA` ou `REJEITADA`.

## Endpoints

### POST

- Método: `POST`
- Rota: `/prestacoes-contas`
- Parâmetros: nenhum
- Body: todos os campos da prestação de contas
- Status esperado: `201 Created`; `400 Bad Request` para body inválido

Exemplo de request:

```json
{
  "descricao": "Hospedagem durante viagem",
  "valor": 480,
  "data": "2026-08-19",
  "funcionario": "João da Silva",
  "categoria": "Hospedagem",
  "formaPagamento": "Cartão corporativo",
  "status": "PENDENTE"
}
```

Exemplo de response:

```json
{
  "id": "66c47aa12ea87f8123456703",
  "descricao": "Hospedagem durante viagem",
  "valor": 480,
  "data": "2026-08-19",
  "funcionario": "João da Silva",
  "categoria": "Hospedagem",
  "formaPagamento": "Cartão corporativo",
  "status": "PENDENTE"
}
```

### GET

- Método: `GET`
- Rota: `/prestacoes-contas`
- Parâmetros: nenhum
- Body: não possui
- Status esperado: `200 OK`

Exemplo de request: `GET /prestacoes-contas`

Exemplo de response:

```json
[
  {
    "id": "66c47aa12ea87f8123456703",
    "descricao": "Hospedagem durante viagem",
    "valor": 480,
    "data": "2026-08-19",
    "funcionario": "João da Silva",
    "categoria": "Hospedagem",
    "formaPagamento": "Cartão corporativo",
    "status": "PENDENTE"
  }
]
```

### GET por ID

- Método: `GET`
- Rota: `/prestacoes-contas/:id`
- Parâmetros: `id` no caminho
- Body: não possui
- Status esperado: `200 OK`; `400 Bad Request` para ID inválido; `404 Not Found` para prestação de contas inexistente

Exemplo de request: `GET /prestacoes-contas/66c47aa12ea87f8123456703`

Exemplo de response:

```json
{
  "id": "66c47aa12ea87f8123456703",
  "descricao": "Hospedagem durante viagem",
  "valor": 480,
  "data": "2026-08-19",
  "funcionario": "João da Silva",
  "categoria": "Hospedagem",
  "formaPagamento": "Cartão corporativo",
  "status": "PENDENTE"
}
```

### PUT

- Método: `PUT`
- Rota: `/prestacoes-contas/:id`
- Parâmetros: `id` no caminho
- Body: todos os campos da prestação de contas
- Status esperado: `200 OK`; `400 Bad Request` para ID ou body inválido; `404 Not Found` para prestação de contas inexistente

Exemplo de request:

```json
{
  "descricao": "Hospedagem durante viagem ao cliente",
  "valor": 510,
  "data": "2026-08-19",
  "funcionario": "João da Silva",
  "categoria": "Hospedagem",
  "formaPagamento": "Cartão corporativo",
  "status": "APROVADA"
}
```

Exemplo de response:

```json
{
  "id": "66c47aa12ea87f8123456703",
  "descricao": "Hospedagem durante viagem ao cliente",
  "valor": 510,
  "data": "2026-08-19",
  "funcionario": "João da Silva",
  "categoria": "Hospedagem",
  "formaPagamento": "Cartão corporativo",
  "status": "APROVADA"
}
```

### DELETE

- Método: `DELETE`
- Rota: `/prestacoes-contas/:id`
- Parâmetros: `id` no caminho
- Body: não possui
- Status esperado: `204 No Content`; `400 Bad Request` para ID inválido; `404 Not Found` para prestação de contas inexistente

Exemplo de request: `DELETE /prestacoes-contas/66c47aa12ea87f8123456703`

Exemplo de response: resposta sem body.

## Validações

- Todos os campos são obrigatórios.
- Campos textuais não podem ser strings vazias.
- `valor` deve ser um número finito maior que zero.
- `status` deve ser `PENDENTE`, `APROVADA` ou `REJEITADA`.
- O `id` deve possuir 24 caracteres hexadecimais.

## Fluxo esperado

```text
/prestacoes-contas → middleware de prestação → controller de prestação
→ service de prestação → repository de prestação → model/coleção de prestações → MongoDB
```

Funcionário, categoria e forma de pagamento seguem como textos no próprio documento.

## Critérios de aceite

- [ ] Deve ser possível cadastrar uma despesa com valor maior que zero.
- [ ] O lançamento deve ser persistido no MongoDB com todos os campos do contrato.
- [ ] O status deve aceitar somente os três valores definidos.
- [ ] A listagem deve devolver todas as prestações cadastradas.
- [ ] A consulta por ID deve distinguir ID inválido de registro inexistente.
- [ ] O PUT deve atualizar todos os dados enviados, inclusive o status.
- [ ] O DELETE deve retornar `204` e remover a prestação.
- [ ] As referências a funcionário, categoria e forma de pagamento devem ser textos simples.
- [ ] As cinco operações devem estar documentadas e executáveis no Swagger.
- [ ] O acesso ao MongoDB deve ficar concentrado no repository.

## Critérios de recusa

A task será recusada se aceitar valor zero ou negativo, aceitar status fora da lista, criar fluxo especial de aprovação, exigir usuário financeiro, buscar funcionário/categoria/forma de pagamento em outras collections, acrescentar comprovante fiscal, armazenar em memória, omitir alguma camada ou documentar um contrato diferente do implementado.

# TASK 04 — CRUD de categorias de despesa

## Contexto

As categorias classificam os lançamentos, como Alimentação, Hospedagem e Transporte. Nesta atividade, o cadastro é independente e não precisa ser consultado pela prestação de contas.

## História

Como integrante do setor financeiro,
quero manter categorias de despesa,
para representar as classificações utilizadas nos lançamentos da empresa.

## Objetivo

Implementar o CRUD persistido de categorias de despesa com nome, descrição e situação ativa.

## Modelo de dados esperado

| Campo | Tipo | Obrigatório | Exemplo |
| --- | --- | --- | --- |
| `nome` | string | sim | `Alimentação` |
| `descricao` | string | sim | `Refeições durante atividades profissionais` |
| `ativo` | boolean | sim | `true` |

## Endpoints

### POST

- Método: `POST`
- Rota: `/categorias-despesa`
- Parâmetros: nenhum
- Body: `nome`, `descricao` e `ativo`
- Status esperado: `201 Created`; `400 Bad Request` para body inválido

Exemplo de request:

```json
{
  "nome": "Alimentação",
  "descricao": "Refeições durante atividades profissionais",
  "ativo": true
}
```

Exemplo de response:

```json
{
  "id": "66c47aa12ea87f8123456704",
  "nome": "Alimentação",
  "descricao": "Refeições durante atividades profissionais",
  "ativo": true
}
```

### GET

- Método: `GET`
- Rota: `/categorias-despesa`
- Parâmetros: nenhum
- Body: não possui
- Status esperado: `200 OK`

Exemplo de request: `GET /categorias-despesa`

Exemplo de response:

```json
[
  {
    "id": "66c47aa12ea87f8123456704",
    "nome": "Alimentação",
    "descricao": "Refeições durante atividades profissionais",
    "ativo": true
  }
]
```

### GET por ID

- Método: `GET`
- Rota: `/categorias-despesa/:id`
- Parâmetros: `id` no caminho
- Body: não possui
- Status esperado: `200 OK`; `400 Bad Request` para ID inválido; `404 Not Found` para categoria inexistente

Exemplo de request: `GET /categorias-despesa/66c47aa12ea87f8123456704`

Exemplo de response:

```json
{
  "id": "66c47aa12ea87f8123456704",
  "nome": "Alimentação",
  "descricao": "Refeições durante atividades profissionais",
  "ativo": true
}
```

### PUT

- Método: `PUT`
- Rota: `/categorias-despesa/:id`
- Parâmetros: `id` no caminho
- Body: todos os campos da categoria
- Status esperado: `200 OK`; `400 Bad Request` para ID ou body inválido; `404 Not Found` para categoria inexistente

Exemplo de request:

```json
{
  "nome": "Alimentação e refeições",
  "descricao": "Refeições realizadas durante atividades profissionais",
  "ativo": true
}
```

Exemplo de response:

```json
{
  "id": "66c47aa12ea87f8123456704",
  "nome": "Alimentação e refeições",
  "descricao": "Refeições realizadas durante atividades profissionais",
  "ativo": true
}
```

### DELETE

- Método: `DELETE`
- Rota: `/categorias-despesa/:id`
- Parâmetros: `id` no caminho
- Body: não possui
- Status esperado: `204 No Content`; `400 Bad Request` para ID inválido; `404 Not Found` para categoria inexistente

Exemplo de request: `DELETE /categorias-despesa/66c47aa12ea87f8123456704`

Exemplo de response: resposta sem body.

## Validações

- `nome` e `descricao` devem ser strings preenchidas.
- `ativo` deve ser booleano.
- O `id` deve possuir 24 caracteres hexadecimais.
- A validação deve acontecer em middleware antes do controller.

## Fluxo esperado

```text
/categorias-despesa → middleware de categoria → controller de categoria
→ service de categoria → repository de categoria → model/coleção de categorias → MongoDB
```

## Critérios de aceite

- [ ] Deve ser possível cadastrar categorias como Alimentação, Hospedagem ou Transporte.
- [ ] Nome e descrição vazios devem retornar `400`.
- [ ] O campo `ativo` deve permanecer booleano em cadastro e atualização.
- [ ] A listagem deve refletir os documentos persistidos no MongoDB.
- [ ] A consulta por ID deve retornar a categoria correta.
- [ ] O PUT deve devolver o documento atualizado.
- [ ] A exclusão deve retornar `204` sem body.
- [ ] O Swagger deve descrever os três campos e as cinco operações.
- [ ] A categoria deve funcionar sem qualquer prestação de contas cadastrada.

## Critérios de recusa

A task será recusada se criar vínculo com lançamentos, se o CRUD não funcionar isoladamente, se `ativo` for tratado como texto, se aceitar nome ou descrição vazios, se o acesso ao model ocorrer fora do repository, se não houver persistência ou se os contratos do Swagger estiverem incompletos.

# TASK 05 — CRUD de formas de pagamento

## Contexto

A forma de pagamento representa como a despesa foi paga, por exemplo PIX, dinheiro ou cartão corporativo. Ela é um cadastro independente nesta Dinamica.

## História

Como integrante do setor financeiro,
quero cadastrar formas de pagamento,
para representar as opções utilizadas nas despesas empresariais.

## Objetivo

Implementar um CRUD persistido de formas de pagamento com contrato simples e documentação Swagger.

## Modelo de dados esperado

| Campo | Tipo | Obrigatório | Exemplo |
| --- | --- | --- | --- |
| `nome` | string | sim | `Cartão corporativo` |
| `descricao` | string | sim | `Cartão fornecido pela empresa` |
| `ativo` | boolean | sim | `true` |

## Endpoints

### POST

- Método: `POST`
- Rota: `/formas-pagamento`
- Parâmetros: nenhum
- Body: `nome`, `descricao` e `ativo`
- Status esperado: `201 Created`; `400 Bad Request` para body inválido

Exemplo de request:

```json
{
  "nome": "Cartão corporativo",
  "descricao": "Cartão fornecido pela empresa",
  "ativo": true
}
```

Exemplo de response:

```json
{
  "id": "66c47aa12ea87f8123456705",
  "nome": "Cartão corporativo",
  "descricao": "Cartão fornecido pela empresa",
  "ativo": true
}
```

### GET

- Método: `GET`
- Rota: `/formas-pagamento`
- Parâmetros: nenhum
- Body: não possui
- Status esperado: `200 OK`

Exemplo de request: `GET /formas-pagamento`

Exemplo de response:

```json
[
  {
    "id": "66c47aa12ea87f8123456705",
    "nome": "Cartão corporativo",
    "descricao": "Cartão fornecido pela empresa",
    "ativo": true
  }
]
```

### GET por ID

- Método: `GET`
- Rota: `/formas-pagamento/:id`
- Parâmetros: `id` no caminho
- Body: não possui
- Status esperado: `200 OK`; `400 Bad Request` para ID inválido; `404 Not Found` para forma de pagamento inexistente

Exemplo de request: `GET /formas-pagamento/66c47aa12ea87f8123456705`

Exemplo de response:

```json
{
  "id": "66c47aa12ea87f8123456705",
  "nome": "Cartão corporativo",
  "descricao": "Cartão fornecido pela empresa",
  "ativo": true
}
```

### PUT

- Método: `PUT`
- Rota: `/formas-pagamento/:id`
- Parâmetros: `id` no caminho
- Body: todos os campos da forma de pagamento
- Status esperado: `200 OK`; `400 Bad Request` para ID ou body inválido; `404 Not Found` para forma de pagamento inexistente

Exemplo de request:

```json
{
  "nome": "Cartão corporativo",
  "descricao": "Cartão empresarial para despesas autorizadas",
  "ativo": false
}
```

Exemplo de response:

```json
{
  "id": "66c47aa12ea87f8123456705",
  "nome": "Cartão corporativo",
  "descricao": "Cartão empresarial para despesas autorizadas",
  "ativo": false
}
```

### DELETE

- Método: `DELETE`
- Rota: `/formas-pagamento/:id`
- Parâmetros: `id` no caminho
- Body: não possui
- Status esperado: `204 No Content`; `400 Bad Request` para ID inválido; `404 Not Found` para forma de pagamento inexistente

Exemplo de request: `DELETE /formas-pagamento/66c47aa12ea87f8123456705`

Exemplo de response: resposta sem body.

## Validações

- `nome` e `descricao` devem ser strings preenchidas.
- `ativo` deve ser booleano.
- O `id` deve possuir 24 caracteres hexadecimais.
- O middleware deve validar os dados manualmente.

## Fluxo esperado

```text
/formas-pagamento → middleware de forma de pagamento → controller
→ service → repository → model/coleção de formas de pagamento → MongoDB
```

## Critérios de aceite

- [ ] Deve ser possível cadastrar uma forma de pagamento com os três campos.
- [ ] A listagem deve devolver formas como PIX, Dinheiro ou Cartão corporativo quando cadastradas.
- [ ] A consulta por ID deve retornar `404` para um documento inexistente.
- [ ] O PUT deve validar novamente todos os campos obrigatórios.
- [ ] Deve ser possível alterar o campo `ativo` para `false`.
- [ ] O DELETE deve remover o documento indicado sem body na resposta.
- [ ] A documentação deve permitir executar o CRUD completo.
- [ ] O módulo deve possuir route, middleware, controller, service, repository e model.
- [ ] A forma de pagamento não deve consultar lançamentos ou outros cadastros.

## Critérios de recusa

A task será recusada se transformar as opções em valores fixos no código sem persistência, exigir vínculo com prestação de contas, aceitar body incompleto, retornar status HTTP incompatível, ignorar IDs inválidos, acessar o MongoDB pelo controller ou não documentar bodies e responses no Swagger.

# TASK 06 — CRUD de fornecedores

## Contexto

O fornecedor representa o estabelecimento ou a empresa onde uma despesa foi realizada, como hotel, restaurante, posto ou papelaria. O cadastro não depende de categorias nem de prestações.

## História

Como integrante do setor financeiro,
quero manter o cadastro de fornecedores,
para registrar os estabelecimentos relacionados às despesas da empresa.

## Objetivo

Implementar o CRUD persistido de fornecedores com dados cadastrais simples.

## Modelo de dados esperado

| Campo | Tipo | Obrigatório | Exemplo |
| --- | --- | --- | --- |
| `nome` | string | sim | `Hotel Central Ltda.` |
| `cnpj` | string | sim | `12.345.678/0001-90` |
| `email` | string | sim | `contato@hotelcentral.com.br` |
| `telefone` | string | sim | `(54) 3333-4455` |
| `ativo` | boolean | sim | `true` |

## Endpoints

### POST

- Método: `POST`
- Rota: `/fornecedores`
- Parâmetros: nenhum
- Body: todos os campos do fornecedor
- Status esperado: `201 Created`; `400 Bad Request` para body inválido

Exemplo de request:

```json
{
  "nome": "Hotel Central Ltda.",
  "cnpj": "12.345.678/0001-90",
  "email": "contato@hotelcentral.com.br",
  "telefone": "(54) 3333-4455",
  "ativo": true
}
```

Exemplo de response:

```json
{
  "id": "66c47aa12ea87f8123456706",
  "nome": "Hotel Central Ltda.",
  "cnpj": "12.345.678/0001-90",
  "email": "contato@hotelcentral.com.br",
  "telefone": "(54) 3333-4455",
  "ativo": true
}
```

### GET

- Método: `GET`
- Rota: `/fornecedores`
- Parâmetros: nenhum
- Body: não possui
- Status esperado: `200 OK`

Exemplo de request: `GET /fornecedores`

Exemplo de response:

```json
[
  {
    "id": "66c47aa12ea87f8123456706",
    "nome": "Hotel Central Ltda.",
    "cnpj": "12.345.678/0001-90",
    "email": "contato@hotelcentral.com.br",
    "telefone": "(54) 3333-4455",
    "ativo": true
  }
]
```

### GET por ID

- Método: `GET`
- Rota: `/fornecedores/:id`
- Parâmetros: `id` no caminho
- Body: não possui
- Status esperado: `200 OK`; `400 Bad Request` para ID inválido; `404 Not Found` para fornecedor inexistente

Exemplo de request: `GET /fornecedores/66c47aa12ea87f8123456706`

Exemplo de response:

```json
{
  "id": "66c47aa12ea87f8123456706",
  "nome": "Hotel Central Ltda.",
  "cnpj": "12.345.678/0001-90",
  "email": "contato@hotelcentral.com.br",
  "telefone": "(54) 3333-4455",
  "ativo": true
}
```

### PUT

- Método: `PUT`
- Rota: `/fornecedores/:id`
- Parâmetros: `id` no caminho
- Body: todos os campos do fornecedor
- Status esperado: `200 OK`; `400 Bad Request` para ID ou body inválido; `404 Not Found` para fornecedor inexistente

Exemplo de request:

```json
{
  "nome": "Hotel Central Ltda.",
  "cnpj": "12.345.678/0001-90",
  "email": "financeiro@hotelcentral.com.br",
  "telefone": "(54) 3333-4466",
  "ativo": true
}
```

Exemplo de response:

```json
{
  "id": "66c47aa12ea87f8123456706",
  "nome": "Hotel Central Ltda.",
  "cnpj": "12.345.678/0001-90",
  "email": "financeiro@hotelcentral.com.br",
  "telefone": "(54) 3333-4466",
  "ativo": true
}
```

### DELETE

- Método: `DELETE`
- Rota: `/fornecedores/:id`
- Parâmetros: `id` no caminho
- Body: não possui
- Status esperado: `204 No Content`; `400 Bad Request` para ID inválido; `404 Not Found` para fornecedor inexistente

Exemplo de request: `DELETE /fornecedores/66c47aa12ea87f8123456706`

Exemplo de response: resposta sem body.

## Validações

- `nome`, `cnpj`, `email` e `telefone` devem ser strings preenchidas.
- `ativo` deve ser booleano.
- O `id` deve possuir 24 caracteres hexadecimais.
- Não é necessário validar matematicamente CNPJ, email ou telefone; basta validar tipo e preenchimento.

## Fluxo esperado

```text
/fornecedores → middleware de fornecedor → controller de fornecedor
→ service de fornecedor → repository de fornecedor → model/coleção de fornecedores → MongoDB
```

## Critérios de aceite

- [ ] Deve ser possível cadastrar um fornecedor com os cinco campos.
- [ ] CNPJ, email e telefone devem ser persistidos como textos.
- [ ] A listagem deve retornar todos os fornecedores cadastrados.
- [ ] A consulta por um ID válido inexistente deve retornar `404`.
- [ ] A atualização deve devolver email e telefone alterados.
- [ ] A exclusão deve retornar `204` sem body.
- [ ] Strings vazias e tipos incorretos devem retornar `400`.
- [ ] O Swagger deve mostrar exemplos relacionados a fornecedores empresariais.
- [ ] O módulo deve funcionar sem categoria ou prestação cadastrada.

## Critérios de recusa

A task será recusada se exigir categoria, despesa ou prestação existente, se criar relacionamentos entre collections, se introduzir validação complexa não solicitada, se armazenar dados em array, se não diferenciar `400` e `404`, se o repository não concentrar o MongoDB ou se faltar documentação de qualquer operação.

# TASK 07 — CRUD de viagens

## Contexto

A viagem representa um deslocamento corporativo que pode gerar despesas. O nome do funcionário é armazenado diretamente no documento, sem vínculo com a collection de funcionários.

## História

Como responsável pelos deslocamentos corporativos,
quero cadastrar viagens de funcionários,
para registrar o contexto em que poderão ocorrer despesas.

## Objetivo

Implementar o CRUD persistido de viagens com datas, motivo, funcionário e status simples.

## Modelo de dados esperado

| Campo | Tipo | Obrigatório | Exemplo |
| --- | --- | --- | --- |
| `destino` | string | sim | `Porto Alegre - RS` |
| `dataInicio` | string | sim | `2026-09-10` |
| `dataFim` | string | sim | `2026-09-12` |
| `motivo` | string | sim | `Visita ao cliente` |
| `funcionario` | string | sim | `Ana Ribeiro` |
| `status` | string | sim | `PLANEJADA` |

O status aceita `PLANEJADA`, `EM_ANDAMENTO` ou `CONCLUIDA`.

## Endpoints

### POST

- Método: `POST`
- Rota: `/viagens`
- Parâmetros: nenhum
- Body: todos os campos da viagem
- Status esperado: `201 Created`; `400 Bad Request` para body inválido

Exemplo de request:

```json
{
  "destino": "Porto Alegre - RS",
  "dataInicio": "2026-09-10",
  "dataFim": "2026-09-12",
  "motivo": "Visita ao cliente",
  "funcionario": "Ana Ribeiro",
  "status": "PLANEJADA"
}
```

Exemplo de response:

```json
{
  "id": "66c47aa12ea87f8123456707",
  "destino": "Porto Alegre - RS",
  "dataInicio": "2026-09-10",
  "dataFim": "2026-09-12",
  "motivo": "Visita ao cliente",
  "funcionario": "Ana Ribeiro",
  "status": "PLANEJADA"
}
```

### GET

- Método: `GET`
- Rota: `/viagens`
- Parâmetros: nenhum
- Body: não possui
- Status esperado: `200 OK`

Exemplo de request: `GET /viagens`

Exemplo de response:

```json
[
  {
    "id": "66c47aa12ea87f8123456707",
    "destino": "Porto Alegre - RS",
    "dataInicio": "2026-09-10",
    "dataFim": "2026-09-12",
    "motivo": "Visita ao cliente",
    "funcionario": "Ana Ribeiro",
    "status": "PLANEJADA"
  }
]
```

### GET por ID

- Método: `GET`
- Rota: `/viagens/:id`
- Parâmetros: `id` no caminho
- Body: não possui
- Status esperado: `200 OK`; `400 Bad Request` para ID inválido; `404 Not Found` para viagem inexistente

Exemplo de request: `GET /viagens/66c47aa12ea87f8123456707`

Exemplo de response:

```json
{
  "id": "66c47aa12ea87f8123456707",
  "destino": "Porto Alegre - RS",
  "dataInicio": "2026-09-10",
  "dataFim": "2026-09-12",
  "motivo": "Visita ao cliente",
  "funcionario": "Ana Ribeiro",
  "status": "PLANEJADA"
}
```

### PUT

- Método: `PUT`
- Rota: `/viagens/:id`
- Parâmetros: `id` no caminho
- Body: todos os campos da viagem
- Status esperado: `200 OK`; `400 Bad Request` para ID ou body inválido; `404 Not Found` para viagem inexistente

Exemplo de request:

```json
{
  "destino": "Porto Alegre - RS",
  "dataInicio": "2026-09-10",
  "dataFim": "2026-09-13",
  "motivo": "Visita e reunião com o cliente",
  "funcionario": "Ana Ribeiro",
  "status": "EM_ANDAMENTO"
}
```

Exemplo de response:

```json
{
  "id": "66c47aa12ea87f8123456707",
  "destino": "Porto Alegre - RS",
  "dataInicio": "2026-09-10",
  "dataFim": "2026-09-13",
  "motivo": "Visita e reunião com o cliente",
  "funcionario": "Ana Ribeiro",
  "status": "EM_ANDAMENTO"
}
```

### DELETE

- Método: `DELETE`
- Rota: `/viagens/:id`
- Parâmetros: `id` no caminho
- Body: não possui
- Status esperado: `204 No Content`; `400 Bad Request` para ID inválido; `404 Not Found` para viagem inexistente

Exemplo de request: `DELETE /viagens/66c47aa12ea87f8123456707`

Exemplo de response: resposta sem body.

## Validações

- Todos os campos devem estar presentes.
- `destino`, `dataInicio`, `dataFim`, `motivo`, `funcionario` e `status` devem ser strings preenchidas.
- `status` deve ser `PLANEJADA`, `EM_ANDAMENTO` ou `CONCLUIDA`.
- O `id` deve possuir 24 caracteres hexadecimais.
- Não é necessário calcular duração nem comparar datas nesta atividade.

## Fluxo esperado

```text
/viagens → middleware de viagem → controller de viagem
→ service de viagem → repository de viagem → model/coleção de viagens → MongoDB
```

O campo `funcionario` é texto simples e não provoca consulta a outro módulo.

## Critérios de aceite

- [ ] Deve ser possível cadastrar destino, período, motivo, funcionário e status.
- [ ] O funcionário deve ser persistido diretamente como string.
- [ ] O status deve aceitar somente os três valores definidos.
- [ ] A listagem deve recuperar as viagens persistidas.
- [ ] A consulta por ID deve retornar `400` para formato inválido e `404` para ausência.
- [ ] O PUT deve permitir atualizar todos os campos da viagem.
- [ ] O DELETE deve retornar `204` sem conteúdo.
- [ ] As cinco operações devem estar completas no Swagger.
- [ ] O controller não deve chamar o repository ou o model diretamente.

## Critérios de recusa

A task será recusada se exigir um funcionário previamente cadastrado, armazenar uma referência para funcionário, comparar collections, criar regras complexas de datas ou aprovação de viagem, aceitar status livre, persistir em memória, omitir validações manuais ou não apresentar o CRUD completo no Swagger.

# TASK 08 — CRUD de departamento, cargo e responsável

## Contexto

Este cadastro representa uma estrutura organizacional simples. Departamento, cargo e responsável pertencem ao mesmo documento e devem permanecer em um único módulo e em uma única collection.

## História

Como responsável administrativo,
quero cadastrar combinações de departamento, cargo e responsável,
para representar de forma simples a estrutura da empresa.

## Objetivo

Implementar um único CRUD persistido para a estrutura organizacional, sem separar seus três dados principais em módulos diferentes.

## Modelo de dados esperado

| Campo | Tipo | Obrigatório | Exemplo |
| --- | --- | --- | --- |
| `departamento` | string | sim | `Tecnologia` |
| `cargo` | string | sim | `Desenvolvedor` |
| `responsavel` | string | sim | `Maria Oliveira` |
| `ativo` | boolean | sim | `true` |

## Endpoints

### POST

- Método: `POST`
- Rota: `/estruturas-organizacionais`
- Parâmetros: nenhum
- Body: `departamento`, `cargo`, `responsavel` e `ativo`
- Status esperado: `201 Created`; `400 Bad Request` para body inválido

Exemplo de request:

```json
{
  "departamento": "Tecnologia",
  "cargo": "Desenvolvedor",
  "responsavel": "Maria Oliveira",
  "ativo": true
}
```

Exemplo de response:

```json
{
  "id": "66c47aa12ea87f8123456708",
  "departamento": "Tecnologia",
  "cargo": "Desenvolvedor",
  "responsavel": "Maria Oliveira",
  "ativo": true
}
```

### GET

- Método: `GET`
- Rota: `/estruturas-organizacionais`
- Parâmetros: nenhum
- Body: não possui
- Status esperado: `200 OK`

Exemplo de request: `GET /estruturas-organizacionais`

Exemplo de response:

```json
[
  {
    "id": "66c47aa12ea87f8123456708",
    "departamento": "Tecnologia",
    "cargo": "Desenvolvedor",
    "responsavel": "Maria Oliveira",
    "ativo": true
  }
]
```

### GET por ID

- Método: `GET`
- Rota: `/estruturas-organizacionais/:id`
- Parâmetros: `id` no caminho
- Body: não possui
- Status esperado: `200 OK`; `400 Bad Request` para ID inválido; `404 Not Found` para estrutura organizacional inexistente

Exemplo de request: `GET /estruturas-organizacionais/66c47aa12ea87f8123456708`

Exemplo de response:

```json
{
  "id": "66c47aa12ea87f8123456708",
  "departamento": "Tecnologia",
  "cargo": "Desenvolvedor",
  "responsavel": "Maria Oliveira",
  "ativo": true
}
```

### PUT

- Método: `PUT`
- Rota: `/estruturas-organizacionais/:id`
- Parâmetros: `id` no caminho
- Body: todos os campos da estrutura organizacional
- Status esperado: `200 OK`; `400 Bad Request` para ID ou body inválido; `404 Not Found` para estrutura organizacional inexistente

Exemplo de request:

```json
{
  "departamento": "Tecnologia",
  "cargo": "Desenvolvedor sênior",
  "responsavel": "Maria Oliveira",
  "ativo": true
}
```

Exemplo de response:

```json
{
  "id": "66c47aa12ea87f8123456708",
  "departamento": "Tecnologia",
  "cargo": "Desenvolvedor sênior",
  "responsavel": "Maria Oliveira",
  "ativo": true
}
```

### DELETE

- Método: `DELETE`
- Rota: `/estruturas-organizacionais/:id`
- Parâmetros: `id` no caminho
- Body: não possui
- Status esperado: `204 No Content`; `400 Bad Request` para ID inválido; `404 Not Found` para estrutura organizacional inexistente

Exemplo de request: `DELETE /estruturas-organizacionais/66c47aa12ea87f8123456708`

Exemplo de response: resposta sem body.

## Validações

- `departamento`, `cargo` e `responsavel` devem ser strings preenchidas.
- `ativo` deve ser booleano.
- O `id` deve possuir 24 caracteres hexadecimais.
- POST e PUT devem executar o middleware manual de validação do body.

## Fluxo esperado

```text
/estruturas-organizacionais → middleware da estrutura → controller da estrutura
→ service da estrutura → repository da estrutura → um model/uma collection → MongoDB
```

## Critérios de aceite

- [ ] Um único documento deve guardar departamento, cargo, responsável e situação ativa.
- [ ] Deve existir somente um CRUD para os três dados organizacionais.
- [ ] O cadastro deve ser persistido no MongoDB.
- [ ] A listagem deve devolver um array de estruturas organizacionais.
- [ ] A consulta por ID deve tratar formato inválido e registro inexistente.
- [ ] O PUT deve atualizar a combinação completa de dados.
- [ ] O DELETE deve retornar `204` sem body.
- [ ] O Swagger deve documentar um único conjunto de cinco endpoints.
- [ ] O acesso ao banco deve ocorrer somente pelo repository.

## Critérios de recusa

A task será recusada se departamento, cargo e responsável forem divididos em tasks, módulos ou collections diferentes; se forem criadas referências entre documentos; se houver mais de um CRUD para a estrutura; se os dados ficarem em memória; se o middleware não validar body e ID; se as camadas forem ignoradas; ou se o Swagger não representar o contrato implementado.
