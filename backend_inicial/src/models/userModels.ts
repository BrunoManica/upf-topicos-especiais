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