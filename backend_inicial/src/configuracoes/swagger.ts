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
