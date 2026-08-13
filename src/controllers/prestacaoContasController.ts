import { Response, Request } from "express";
import { ConsultaContas, DadosContaReceber } from "../types/prestacaoConta";
import { criarConta, listarContas, atualizarConta } from "../services/contasReceberService";

interface ParametrosId {
    id: String
}

export function criar(
    requisicao: Request<object, object, DadosContaReceber>,
    resposta: Response) {
    const prestacaoConta = requisicao.body;
    const retorno = criarConta(prestacaoConta)

    resposta.status(201).json(retorno)
}


export function listar(requisicao: Request<object, object, object, ConsultaContas>,
    resposta: Response) {

    const { empresa, status } = requisicao.query
    const contas = listarContas(empresa, status)
    resposta.status(200).json(contas)
}

export function atualizar(requisicao: Request<ParametrosId, object, DadosContaReceber>,
    resposta: Response) {
    const conta = atualizarConta(requisicao.params.id, requisicao.body)

    if (conta) {
        resposta.status(200).json({ mensagem: "sucesso ao atualizar" })
        return
    }

    resposta.status(500).json({ mensagem: "Erro ao atualizar" })
}

