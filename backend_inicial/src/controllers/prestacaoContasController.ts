import { Response, Request } from "express";


interface prestacaoConta {
    nomeGasto: string,
    data: string,
    valor: number,
    arquivo: string
}

export function salvar(
    requisicao: Request<object, object, prestacaoConta>,
    resposta: Response) {
    const prestacaoConta = requisicao.body;
    console.log(prestacaoConta)

    resposta.status(201).json({
        mensagem: "conta criada com sucesso"
    })


}