import { Request, Response } from 'express';
import { Usuario } from '../types/usuario';
import {criarUsuario, listarUsuarios, atualizarUsuario, excluirUsuario} from '../services/userService'

interface ParametrosId {
  id: String;
}

export interface ConsultaUsuario {
  id?: string;
}


export function criar(
  requisicao: Request<object, object, Usuario>,
  resposta: Response,
) {
  const novoUsuario = requisicao.body;
  const retorno = criarUsuario(novoUsuario);

  resposta.status(201).json(retorno);
}

export function listarUsuario(
  requisicao: Request<object, object, object, ConsultaUsuario>,
  resposta: Response,
) {
  const { id } = requisicao.query;
  const usuarios = listarUsuarios(id);
  resposta.status(200).json(usuarios);
}

export function atualizar(
  requisicao: Request<ParametrosId, object, Usuario>,
  resposta: Response,
) {
  const usuario = atualizarUsuario(requisicao.params.id, requisicao.body);

  if (usuario) {
    resposta.status(200).json({ mensagem: 'sucesso ao atualizar' })
    return
  }

  resposta.status(500).json({ mensagem: 'Erro ao atualizar' });
}

export function excluir(
  requisicao: Request<ParametrosId, object, object>,
  resposta: Response,
) {
  if (excluirUsuario(requisicao.params.id)) {
    resposta.status(200).json({ mensagem: 'sucesso ao excluir' });
    return;
  }

  resposta.status(500).json({ mensagem: 'Erro ao excluir' });
}



export function getUsuarioById(
  requisicao: Request<ParametrosId, object, object>,
  resposta: Response,
) {
  if (excluirConta(requisicao.params.id)) {
    resposta.status(200).json({ mensagem: 'sucesso ao excluir' });
    return;
  }

  resposta.status(500).json({ mensagem: 'Erro ao excluir' });
}
