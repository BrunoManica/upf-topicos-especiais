import { ContaReceber, DadosContaReceber } from "../types/prestacaoConta";


let contas: ContaReceber[] = [
    {
        id: 1,
        empresa: "automasul",
        descricao: "bati um rangao",
        data: "2026-08-05",
        valor: 3.80,
        notaFiscalBase64: "çjfhçkshfçLDHFÇLKFçlKJS",
        status: "PENDENTE"
    }
]

let proximoId = 2


export function listarContas(empresa?: string, status?: string) {
    let resultado = contas;
    console.log("oi to passando em listarContas")


    if (empresa) {
        resultado = resultado.filter((conta) =>
            conta.empresa
                .includes(empresa.toLocaleLowerCase())
        )
    }


    if (status) {
        resultado = resultado.filter((conta) => conta.status == status)
    }

    return resultado
}

export function criarConta(dados: DadosContaReceber) {
    const novaConta: ContaReceber = {
        id: proximoId,
        ...dados,
        status: "PENDENTE"
    }

    proximoId = proximoId + 1
    contas.push(novaConta)
    return novaConta

}



export function atualizarConta(id: String, body: DadosContaReceber): String | null {
    const idEmNumero = Number(id)

    if (isNaN(idEmNumero)) {
        return null
    }

  
    contas = contas.map((conta) => {
        if (idEmNumero !== conta.id) {
            return conta
        }
        conta.empresa = body.empresa
        conta.descricao = body.descricao
        conta.data = body.data
        conta.valor = body.valor
        conta.notaFiscalBase64 = body.notaFiscalBase64

        return conta
    })

    return id
}


export function excluirConta(id:String):boolean{
    const idEmNumero = Number(id)

    if (isNaN(idEmNumero)) {
        return false
    }
    //forma 1
    const indexASerExcluido = contas.findIndex((conta)=> conta.id==idEmNumero)
    contas.splice(indexASerExcluido,1)
    //forma 2
    contas = contas.filter((conta)=> conta.id==idEmNumero)

    return true
}