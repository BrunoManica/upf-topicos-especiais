import { Router } from "express";
import { helloController } from "../controllers/helloController";
import { buscarPorCpf } from "../controllers/usariosController";
import { salvar } from "../controllers/prestacaoContasController";

export const rotas = Router();

rotas.get("/", helloController)
rotas.get("/buscar-por-cpf/:cpf", buscarPorCpf)
rotas.post("/salvar-prestacao-contas/", salvar)
