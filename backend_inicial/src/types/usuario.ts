

export type Usuario = {
  nome: string;
  email: string;
  senha?: string;
  perfil: 'ADMIN' | 'FINANCEIRO' | 'COMERCIAL';
  ativo: boolean;
};


