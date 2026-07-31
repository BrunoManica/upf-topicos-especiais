import { Request, Response } from "express";

export function helloController(_requisicao:Request, resposta:Response):void {
    resposta.status(200).json({ mensagem: "oi bruno"})
}

