export type StatusConta = "PENDENTE" |
 "RECEBIDA" | "CANCELADA"


export interface DadosContaReceber {
    empresa: string,
    descricao: string,
    data: string,
    valor: number,
    notaFiscalBase64: string
}

export interface ConsultaContas {
    empresa?:string;
    status?:string;
}

export interface ContaReceber{
    id:number;
    empresa: string,
    descricao: string,
    data: string,
    valor: number,
    notaFiscalBase64: string
    status:StatusConta
}
