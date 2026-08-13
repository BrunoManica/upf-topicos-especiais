import { DadosContaReceber } from "../types/prestacaoConta";
import { NextFunction, Request,Response } from "express";

export function validarDadosConta(   
     requisicao: Request<object, object, DadosContaReceber>,
    resposta: Response, proximo:NextFunction){
        console.log("passei aqui")
        proximo();

}