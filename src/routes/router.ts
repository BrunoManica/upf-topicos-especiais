import { Router } from "express";
import { helloController } from "../controllers/helloController";
import { buscarPorCpf } from "../controllers/usariosController";
import { listar, criar, atualizar } from "../controllers/prestacaoContasController";
import { validarDadosConta } from "../middlewares/validarCorpo";

export const rotas = Router();

// rotas.get("/", helloController)
rotas.get("/contas", listar)
rotas.post("/", validarDadosConta,criar)
rotas.get("/buscar-por-cpf/:cpf", buscarPorCpf)
rotas.put("/:id", atualizar)
rotas.post("/salvar-prestacao-contas/", criar)
