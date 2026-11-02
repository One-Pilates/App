import { Platform } from 'react-native';
import api from './api';

export type StatusPassoIA = 'EM_ANDAMENTO' | 'CONCLUIDA' | 'ERRO';

export interface PassoIA {
  texto: string;
  status: StatusPassoIA;
}

export interface AcaoRealizacaoDTO {
  ordem: number;
  descricao: string;
  status: StatusPassoIA;
  iniciadaEm?: string;
  finalizadaEm?: string;
}

export interface IARealizacaoDTO {
  realizacaoId: number;
  status: 'PENDENTE' | 'PROCESSANDO' | 'CONCLUIDO' | 'ERRO';
  mensagemOriginal?: string;
  promptMelhorado?: string;
  resposta?: string;
  erro?: string;
  acoes?: AcaoRealizacaoDTO[];
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface IASolicitacaoDTO {
  realizacaoId: number;
  status: string;
  textoTranscrito?: string;
  conversaId?: number;
}

export interface IAConversaResumoDTO {
  conversaId: number;
  titulo: string;
  criadaEm?: string;
  ultimoUso?: string;
  totalMensagens: number;
}

export interface IAConversaDetalheDTO {
  conversaId: number;
  titulo: string;
  criadaEm?: string;
  ultimoUso?: string;
  mensagens: IARealizacaoDTO[];
}

export interface AudioUploadAsset {
  uri: string;
  name?: string;
  mimeType?: string;
  file?: File | Blob;
}

const AGENTE_INTERVALO_MS = 1400;
const AGENTE_LIMITE_MS = 180000;
const AGENTE_MAX_FALHAS_REDE = 3;

const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function extrairMensagemErro(data: any): string {
  if (!data) return '';
  if (typeof data === 'string') return data.trim();
  return String(data.erro || data.message || data.error || '').trim();
}

function traduzirErroIA(err: any): Error {
  const status = err?.response?.status;
  const msgServidor = extrairMensagemErro(err?.response?.data);
  if (status === 401 || status === 403) {
    return new Error(
      msgServidor || 'Sua sessão pode ter expirado. Faça login novamente para continuar.',
    );
  }
  if (status === 400) {
    return new Error(
      msgServidor || 'Não foi possível validar sua solicitação. Verifique os dados enviados.',
    );
  }
  if (err?.response) {
    return new Error(
      msgServidor || 'O assistente de IA não conseguiu processar o seu pedido no momento.',
    );
  }
  return new Error(
    err?.message || 'Não foi possível conectar ao servidor do assistente de IA.',
  );
}

export function extrairPassosIA(andamento: IARealizacaoDTO | null | undefined): PassoIA[] {
  const passos: PassoIA[] = (andamento?.acoes ?? [])
    .map((a) => ({
      texto: String(a?.descricao ?? '').trim(),
      status: (a?.status as StatusPassoIA) || 'CONCLUIDA',
    }))
    .filter((p) => p.texto.length > 0);

  const statusPedido = String(andamento?.status || '').toUpperCase();
  const algumAtivo = passos.some((p) => p.status === 'EM_ANDAMENTO');

  if (statusPedido === 'PENDENTE') {
    passos.push({ texto: 'Aguardando na fila de processamento', status: 'EM_ANDAMENTO' });
  } else if (statusPedido === 'PROCESSANDO' && !algumAtivo) {
    passos.push({
      texto: passos.length > 0 ? 'Elaborando a resposta final' : 'Analisando o seu pedido',
      status: 'EM_ANDAMENTO',
    });
  }

  return passos;
}

async function acompanharRealizacao(
  realizacaoId: number,
  onProgresso?: (passos: PassoIA[]) => void,
): Promise<{ resposta: string; passos: PassoIA[] }> {
  const inicio = Date.now();
  let falhasRede = 0;
  let passosJson = '';

  while (Date.now() - inicio < AGENTE_LIMITE_MS) {
    await esperar(AGENTE_INTERVALO_MS);

    let andamento: IARealizacaoDTO;
    try {
      const response = await api.get<IARealizacaoDTO>(`api/ia/realizacoes/${realizacaoId}`, {
        timeout: 15000,
        skipAuthRedirect: true,
      } as any);
      andamento = response.data;
      falhasRede = 0;
    } catch (err: any) {
      if (!err?.response && ++falhasRede < AGENTE_MAX_FALHAS_REDE) {
        continue;
      }
      throw traduzirErroIA(err);
    }

    const passos = extrairPassosIA(andamento);
    const json = JSON.stringify(passos);
    if (json !== passosJson) {
      passosJson = json;
      onProgresso?.(passos);
    }

    const status = String(andamento?.status || '').toUpperCase();
    if (status === 'CONCLUIDO') {
      const passosFinais = (andamento?.acoes ?? [])
        .map((a) => ({
          texto: String(a?.descricao ?? '').trim(),
          status: (a?.status as StatusPassoIA) || 'CONCLUIDA',
        }))
        .filter((p) => p.texto.length > 0);
      return {
        resposta: andamento.resposta || 'O assistente concluiu a solicitação.',
        passos: passosFinais,
      };
    }

    if (status === 'ERRO') {
      throw new Error(
        andamento.erro || 'O assistente não conseguiu concluir o pedido. Tente novamente.',
      );
    }
  }

  throw new Error(
    'O assistente demorou mais que o esperado para responder. Confira a agenda antes de repetir o pedido.',
  );
}

/**
 * Envia uma mensagem de texto ao Agente de IA e aguarda o processamento completo.
 */
export async function conversarComAgenteTexto({
  usuarioId,
  mensagem,
  novaConversa = false,
  conversaId,
  onProgresso,
}: {
  usuarioId: number;
  mensagem: string;
  novaConversa?: boolean;
  conversaId?: number | null;
  onProgresso?: (passos: PassoIA[]) => void;
}): Promise<{ resposta: string; passos: PassoIA[]; conversaId?: number }> {
  const dataRequisicao = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 19);

  let solicitacao: IASolicitacaoDTO;
  try {
    const { data } = await api.post<IASolicitacaoDTO>(
      'api/ia/agente',
      {
        usuarioId,
        dataRequisicao,
        mensagem,
        novaConversa,
        ...(conversaId ? { conversaId } : {}),
      },
      {
        timeout: 30000,
        skipAuthRedirect: true,
      } as any,
    );
    solicitacao = data;
  } catch (err) {
    throw traduzirErroIA(err);
  }

  if (solicitacao?.realizacaoId === undefined || solicitacao?.realizacaoId === null) {
    throw new Error('O assistente não retornou o identificador da solicitação.');
  }

  const resultado = await acompanharRealizacao(solicitacao.realizacaoId, onProgresso);
  return {
    ...resultado,
    conversaId: solicitacao.conversaId,
  };
}

/**
 * Envia um arquivo/gravação de áudio ao backend, que realiza a transcrição via Whisper
 * e encaminha automaticamente para o Agente de IA.
 */
export async function conversarComAgenteAudio({
  usuarioId,
  audio,
  novaConversa = false,
  conversaId,
  onTranscrito,
  onProgresso,
}: {
  usuarioId: number;
  audio: AudioUploadAsset;
  novaConversa?: boolean;
  conversaId?: number | null;
  onTranscrito?: (textoTranscrito: string) => void;
  onProgresso?: (passos: PassoIA[]) => void;
}): Promise<{ resposta: string; textoTranscrito: string; passos: PassoIA[]; conversaId?: number }> {
  const formData = new FormData();
  const nomeArquivo = audio.name || 'gravacao.m4a';
  const tipoMime = audio.mimeType || 'audio/m4a';

  if (Platform.OS === 'web') {
    if (audio.file) {
      formData.append('audio', audio.file, nomeArquivo);
    } else {
      const respBlob = await fetch(audio.uri);
      const blob = await respBlob.blob();
      formData.append('audio', blob, nomeArquivo);
    }
  } else {
    formData.append('audio', {
      uri: audio.uri,
      name: nomeArquivo,
      type: tipoMime,
    } as any);
  }

  formData.append('usuarioId', String(usuarioId));
  formData.append('novaConversa', String(Boolean(novaConversa)));
  if (conversaId) {
    formData.append('conversaId', String(conversaId));
  }

  let solicitacao: IASolicitacaoDTO;
  try {
    const { data } = await api.post<IASolicitacaoDTO>('api/ia/agente/audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
      skipAuthRedirect: true,
    } as any);
    solicitacao = data;
  } catch (err) {
    throw traduzirErroIA(err);
  }

  if (solicitacao?.realizacaoId === undefined || solicitacao?.realizacaoId === null) {
    throw new Error('O assistente não retornou o identificador da solicitação de áudio.');
  }

  const textoTranscrito = solicitacao.textoTranscrito?.trim() || 'Áudio enviado';
  onTranscrito?.(textoTranscrito);

  const { resposta, passos } = await acompanharRealizacao(solicitacao.realizacaoId, onProgresso);
  return {
    resposta,
    textoTranscrito,
    passos,
    conversaId: solicitacao.conversaId,
  };
}

/** Lista o histórico de conversas do usuário logado no backend. */
export async function listarConversasIA(): Promise<IAConversaResumoDTO[]> {
  const { data } = await api.get<IAConversaResumoDTO[]>('api/ia/conversas', {
    timeout: 15000,
    skipAuthRedirect: true,
  } as any);
  return Array.isArray(data) ? data : [];
}

/** Obtém os detalhes (mensagens e etapas) de uma conversa específica do histórico. */
export async function obterConversaIA(conversaId: number): Promise<IAConversaDetalheDTO> {
  const { data } = await api.get<IAConversaDetalheDTO>(`api/ia/conversas/${conversaId}`, {
    timeout: 15000,
    skipAuthRedirect: true,
  } as any);
  return data;
}

/** Exclui uma conversa específica do histórico do usuário no backend. */
export async function excluirConversaIA(conversaId: number): Promise<void> {
  await api.delete(`api/ia/conversas/${conversaId}`, {
    timeout: 15000,
    skipAuthRedirect: true,
  } as any);
}
