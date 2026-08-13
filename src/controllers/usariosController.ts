import { Request, Response } from "express";

export function buscarPorCpf(
    requisicao: Request<{ cpf: string }>,
    resposta: Response
): void {
    const { cpf } = requisicao.params

    resposta.status(200).json({ 
        nome:"fulano de tal",
        cpf:cpf,
        contasPrestadas:[
            {
                id:1,
                nomeGasto:"ao mossar",
                data:"2026-07-28",
                valor: 998.99,
                status: "REJEITADO"
            }
        ]
    })
}




