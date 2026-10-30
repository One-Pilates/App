import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from "expo-audio";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, ThemeColors } from "@/contexts/ThemeContext";
import {
  conversarComAgenteTexto,
  conversarComAgenteAudio,
  listarConversasIA,
  obterConversaIA,
  excluirConversaIA,
  PassoIA,
  AudioUploadAsset,
  StatusPassoIA,
} from "@/services/ia";
import { notify } from "@/utils/notify";

interface Props {
  visible: boolean;
  onFechar: () => void;
  onAlterado?: () => void;
}

export interface MensagemChat {
  id: string;
  role: "user" | "ia";
  text: string;
  viaAudio?: boolean;
  transcrevendo?: boolean;
  erro?: boolean;
  passos?: PassoIA[];
  criadoEm?: string;
}

export interface SessaoConversaIA {
  id: string;
  backendConversaId?: number;
  titulo: string;
  criadaEm: string;
  atualizadaEm: string;
  mensagens: MensagemChat[];
}

const SUGESTOES_SECRETARIA = [
  "Quais aulas temos hoje?",
  "Aulas marcadas nesta semana",
  "Professores e salas disponíveis",
  "Resumo do estúdio nos últimos 30 dias",
];

const SUGESTOES_PROFESSOR = [
  "Quais são as minhas aulas de hoje?",
  "Minhas aulas desta semana",
  "Meu desempenho nos últimos 30 dias",
  "Minhas ausências registradas",
];

function chaveStorageConversas(userId?: number | string): string {
  return `@OnePilates:oneia_historico_v2_${userId ?? "anon"}`;
}

function gerarTituloConversa(texto: string): string {
  const limpo = texto.replace(/\s+/g, " ").trim();
  if (!limpo) return "Nova conversa";
  return limpo.length <= 44 ? limpo : `${limpo.slice(0, 44).trim()}...`;
}

function formatarDataHistorico(iso?: string): string {
  if (!iso) return "Recente";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "Recente";

  const agora = new Date();
  const mesmoDia =
    data.getDate() === agora.getDate() &&
    data.getMonth() === agora.getMonth() &&
    data.getFullYear() === agora.getFullYear();

  const horas = String(data.getHours()).padStart(2, "0");
  const minutos = String(data.getMinutes()).padStart(2, "0");

  if (mesmoDia) {
    return `Hoje · ${horas}:${minutos}`;
  }

  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes} · ${horas}:${minutos}`;
}

function decodificarEntidades(texto: string): string {
  return texto
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function limparTagsInline(html: string): string {
  return decodificarEntidades(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/?(?:strong|b|em|i|span|p)[^>]*>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\*{2,3}/g, "")
  ).trim();
}

/**
 * Normaliza marcações Markdown (***negrito itálico***, **negrito**, *itálico*,
 * títulos ### e listas - / 1.) para tags HTML suportadas pelo renderizador nativo.
 */
function normalizarMarkdownParaHtml(textoBruto: string): string {
  if (!textoBruto) return "";

  let texto = textoBruto.replace(/\r\n/g, "\n");

  // Converte títulos Markdown (ex: ### Resumo do estúdio) em <h3>
  texto = texto.replace(/^\s*#{1,6}\s+(.+)$/gm, "<h3>$1</h3>");

  // Converte linhas inteiras que são apenas ***Título*** em <h3>Título</h3>
  texto = texto.replace(/^\s*\*\*\*([^*\n]+)\*\*\*\s*$/gm, "<h3>$1</h3>");

  // Converte ***texto*** (negrito + itálico) -> <strong><em>texto</em></strong>
  texto = texto.replace(/\*\*\*([\s\S]+?)\*\*\*/g, "<strong><em>$1</em></strong>");

  // Converte **texto** ou __texto__ (negrito) -> <strong>texto</strong>
  texto = texto.replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>");
  texto = texto.replace(/__([\s\S]+?)__/g, "<strong>$1</strong>");

  // Converte *texto* isolado (itálico) -> <em>texto</em>
  texto = texto.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>");

  // Remove eventuais asteriscos duplos/triplos órfãos
  texto = texto.replace(/\*{2,}/g, "");

  if (!/<(?:ul|ol)\b/i.test(texto)) {
    const linhas = texto.split("\n");
    const resultado: string[] = [];
    let listaAtual: { tipo: "ul" | "ol"; itens: string[] } | null = null;

    const fecharLista = () => {
      if (listaAtual) {
        const tag = listaAtual.tipo;
        const lis = listaAtual.itens.map((it) => `<li>${it}</li>`).join("");
        resultado.push(`<${tag}>${lis}</${tag}>`);
        listaAtual = null;
      }
    };

    for (const linha of linhas) {
      const matchUl = linha.match(/^\s*[-*•]\s+(.+)$/);
      const matchOl = linha.match(/^\s*\d+[.)]\s+(.+)$/);

      if (matchUl) {
        if (listaAtual && listaAtual.tipo !== "ul") fecharLista();
        if (!listaAtual) listaAtual = { tipo: "ul", itens: [] };
        listaAtual.itens.push(matchUl[1].trim());
      } else if (matchOl) {
        if (listaAtual && listaAtual.tipo !== "ol") fecharLista();
        if (!listaAtual) listaAtual = { tipo: "ol", itens: [] };
        listaAtual.itens.push(matchOl[1].trim());
      } else {
        fecharLista();
        resultado.push(linha);
      }
    }
    fecharLista();
    texto = resultado.join("\n");
  }

  return texto;
}

/**
 * Renderiza texto com suporte a <strong>, <b>, <em>, <i> e <br> em componentes Text nativos.
 */
function TextoFormatadoInline({
  html,
  style,
  boldStyle,
  italicStyle,
}: {
  html: string;
  style?: any;
  boldStyle?: any;
  italicStyle?: any;
}) {
  const comMarkdown = normalizarMarkdownParaHtml(html);
  const normalizado = decodificarEntidades(
    comMarkdown.replace(/<br\s*\/?>/gi, "\n")
  );
  const partes = normalizado.split(
    /(<(?:strong|b)>\s*<(?:em|i)>[\s\S]*?<\/(?:em|i)>\s*<\/(?:strong|b)>|<(?:strong|b|em|i)>[\s\S]*?<\/(?:strong|b|em|i)>)/gi
  );

  return (
    <Text style={style}>
      {partes.map((parte, idx) => {
        if (!parte) return null;
        if (/^<(?:strong|b)>\s*<(?:em|i)>/i.test(parte)) {
          const conteudo = parte.replace(
            /^<(?:strong|b)>\s*<(?:em|i)>|<\/(?:em|i)>\s*<\/(?:strong|b)>$/gi,
            ""
          );
          return (
            <Text key={idx} style={[boldStyle, italicStyle]}>
              {limparTagsInline(conteudo)}
            </Text>
          );
        }
        if (/^<(?:strong|b)>/i.test(parte)) {
          const conteudo = parte.replace(/^<(?:strong|b)>|<\/(?:strong|b)>$/gi, "");
          return (
            <Text key={idx} style={boldStyle}>
              {limparTagsInline(conteudo)}
            </Text>
          );
        }
        if (/^<(?:em|i)>/i.test(parte)) {
          const conteudo = parte.replace(/^<(?:em|i)>|<\/(?:em|i)>$/gi, "");
          return (
            <Text key={idx} style={italicStyle}>
              {limparTagsInline(conteudo)}
            </Text>
          );
        }
        return <React.Fragment key={idx}>{limparTagsInline(parte)}</React.Fragment>;
      })}
    </Text>
  );
}

/**
 * Converte a resposta da IA (texto puro, Markdown ou HTML estruturado do AgentService)
 * em blocos nativos do React Native.
 */
function ConteudoMensagemIA({
  texto,
  styles,
  erro,
}: {
  texto: string;
  styles: ReturnType<typeof getStyles>;
  erro?: boolean;
}) {
  if (erro) {
    return (
      <Text style={[styles.msgIaTexto, styles.msgErroTexto]}>
        {limparTagsInline(texto)}
      </Text>
    );
  }

  const textoNormalizado = normalizarMarkdownParaHtml(texto);
  const temHtml = /<\/?[a-z][a-z0-9]*[^>]*>/i.test(textoNormalizado);

  if (!temHtml) {
    return (
      <Text style={styles.msgIaTexto}>
        {decodificarEntidades(textoNormalizado)}
      </Text>
    );
  }

  const blocosRegex =
    /<(h3|h4|p|ul|ol|table)[^>]*>([\s\S]*?)<\/\1>/gi;
  const blocos: { tipo: string; conteudo: string }[] = [];
  let ultimoIndice = 0;
  let match: RegExpExecArray | null;

  while ((match = blocosRegex.exec(textoNormalizado)) !== null) {
    if (match.index > ultimoIndice) {
      const solto = textoNormalizado.slice(ultimoIndice, match.index).trim();
      if (solto) {
        blocos.push({ tipo: "p", conteudo: solto });
      }
    }
    blocos.push({ tipo: match[1].toLowerCase(), conteudo: match[2] });
    ultimoIndice = blocosRegex.lastIndex;
  }

  if (ultimoIndice < textoNormalizado.length) {
    const restante = textoNormalizado.slice(ultimoIndice).trim();
    if (restante) {
      blocos.push({ tipo: "p", conteudo: restante });
    }
  }

  if (blocos.length === 0) {
    return (
      <TextoFormatadoInline
        html={textoNormalizado}
        style={styles.msgIaTexto}
        boldStyle={styles.msgIaBold}
        italicStyle={styles.msgIaItalic}
      />
    );
  }

  return (
    <View style={styles.htmlContainer}>
      {blocos.map((bloco, idx) => {
        if (bloco.tipo === "h3" || bloco.tipo === "h4") {
          return (
            <TextoFormatadoInline
              key={idx}
              html={bloco.conteudo}
              style={styles.htmlHeading}
              boldStyle={styles.htmlHeading}
              italicStyle={styles.msgIaItalic}
            />
          );
        }

        if (bloco.tipo === "ul" || bloco.tipo === "ol") {
          const itens = Array.from(
            bloco.conteudo.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)
          ).map((m) => m[1]);

          return (
            <View key={idx} style={styles.htmlList}>
              {itens.map((item, i) => (
                <View key={i} style={styles.htmlListItem}>
                  <Text style={styles.htmlListBullet}>
                    {bloco.tipo === "ol" ? `${i + 1}.` : "•"}
                  </Text>
                  <View style={styles.flex1}>
                    <TextoFormatadoInline
                      html={item}
                      style={styles.msgIaTexto}
                      boldStyle={styles.msgIaBold}
                      italicStyle={styles.msgIaItalic}
                    />
                  </View>
                </View>
              ))}
            </View>
          );
        }

        if (bloco.tipo === "table") {
          const linhas = Array.from(
            bloco.conteudo.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)
          ).map((m) => m[1]);

          return (
            <View key={idx} style={styles.htmlTable}>
              {linhas.map((linhaHtml, rIdx) => {
                const celulas = Array.from(
                  linhaHtml.matchAll(/<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi)
                );
                const ehHeader = celulas.some(
                  (c) => c[1].toLowerCase() === "th"
                );
                return (
                  <View
                    key={rIdx}
                    style={[
                      styles.htmlTableRow,
                      ehHeader && styles.htmlTableHeaderRow,
                      rIdx === linhas.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    {celulas.map((cel, cIdx) => (
                      <Text
                        key={cIdx}
                        style={[
                          styles.htmlTableCell,
                          ehHeader && styles.htmlTableHeaderCell,
                        ]}
                      >
                        {limparTagsInline(cel[2])}
                      </Text>
                    ))}
                  </View>
                );
              })}
            </View>
          );
        }

        const limpo = bloco.conteudo.trim();
        if (!limpo) return null;

        return (
          <TextoFormatadoInline
            key={idx}
            html={limpo}
            style={styles.msgIaTexto}
            boldStyle={styles.msgIaBold}
            italicStyle={styles.msgIaItalic}
          />
        );
      })}
    </View>
  );
}

function ListaPassosView({
  passos,
  styles,
  colors,
}: {
  passos: PassoIA[];
  styles: ReturnType<typeof getStyles>;
  colors: ThemeColors;
}) {
  const conteudo = (
    <View style={styles.passosLista}>
      {passos.map((p, i) => {
        const emAndamento = p.status === "EM_ANDAMENTO";
        const falhou = p.status === "ERRO";
        return (
          <View key={i} style={styles.passoItem}>
            <View style={styles.passoIconeWrap}>
              {emAndamento ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : falhou ? (
                <Feather name="alert-circle" size={13} color={colors.danger} />
              ) : (
                <Feather name="check-circle" size={13} color="#10b981" />
              )}
            </View>
            <Text
              style={[
                styles.passoTexto,
                emAndamento && styles.passoTextoAtivo,
                falhou && { color: colors.danger },
              ]}
            >
              {limparTagsInline(p.texto)}
            </Text>
          </View>
        );
      })}
    </View>
  );

  if (passos.length > 5) {
    return (
      <ScrollView
        style={styles.passosScroll}
        nestedScrollEnabled
        showsVerticalScrollIndicator={true}
      >
        {conteudo}
      </ScrollView>
    );
  }

  return conteudo;
}

function formatarDuracao(segundos: number): string {
  const min = Math.floor(segundos / 60);
  const seg = segundos % 60;
  return `${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
}

export default function AssistenteIASheet({
  visible,
  onFechar,
  onAlterado,
}: Props) {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => getStyles(colors, isDark, insets.top, insets.bottom),
    [colors, isDark, insets.top, insets.bottom]
  );

  const ehProfessor = (user?.role || "").toUpperCase() === "PROFESSOR";
  const sugestoes = ehProfessor ? SUGESTOES_PROFESSOR : SUGESTOES_SECRETARIA;
  const primeiroNome = user?.nome ? user.nome.split(" ")[0] : "você";
  const iniciaisUsuario = useMemo(() => {
    const partes = (user?.nome || "OP").trim().split(/\s+/);
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
  }, [user?.nome]);

  const [conversas, setConversas] = useState<SessaoConversaIA[]>([]);
  const [conversaAtivaId, setConversaAtivaId] = useState<string | null>(null);
  const [backendConversaId, setBackendConversaId] = useState<number | null>(null);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [forcarNovaConversaBackend, setForcarNovaConversaBackend] = useState(false);

  const [menuHistoricoAberto, setMenuHistoricoAberto] = useState(false);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [abaInferior, setAbaInferior] = useState<"chat" | "sugestoes">("chat");

  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [transcrevendoAudio, setTranscrevendoAudio] = useState(false);
  const [passosAtuais, setPassosAtuais] = useState<PassoIA[]>([]);
  const [passosExpandidos, setPassosExpandidos] = useState<Record<string, boolean>>({});

  // Gravação de áudio (expo-audio nativo + fallback web MediaRecorder)
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [gravando, setGravando] = useState(false);
  const [segundosGravacao, setSegundosGravacao] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const webRecorderRef = useRef<any>(null);
  const webChunksRef = useRef<BlobPart[]>([]);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView> | null>(null);

  // Salva lista de conversas no AsyncStorage
  const persistirConversasLocal = useCallback(
    async (lista: SessaoConversaIA[]) => {
      if (!user?.id) return;
      try {
        await AsyncStorage.setItem(
          chaveStorageConversas(user.id),
          JSON.stringify(lista.slice(0, 40))
        );
      } catch {
        // ignora erro de armazenamento local
      }
    },
    [user?.id]
  );

  // Sincroniza histórico local + backend ao abrir a tela da OneIA
  const carregarHistoricoConversas = useCallback(async () => {
    if (!user?.id) return;
    setCarregandoHistorico(true);
    try {
      const raw = await AsyncStorage.getItem(chaveStorageConversas(user.id));
      const locais: SessaoConversaIA[] = raw ? JSON.parse(raw) : [];

      try {
        const remotas = await listarConversasIA();
        const mapaPorBackendId = new Map<number, SessaoConversaIA>();
        for (const loc of locais) {
          if (loc.backendConversaId) {
            mapaPorBackendId.set(loc.backendConversaId, loc);
          }
        }

        const mescladas: SessaoConversaIA[] = [...locais];
        for (const rem of remotas) {
          if (!mapaPorBackendId.has(rem.conversaId)) {
            mescladas.push({
              id: `srv-${rem.conversaId}`,
              backendConversaId: rem.conversaId,
              titulo: rem.titulo || "Conversa com OneIA",
              criadaEm: rem.criadaEm || new Date().toISOString(),
              atualizadaEm: rem.ultimoUso || rem.criadaEm || new Date().toISOString(),
              mensagens: [],
            });
          }
        }

        mescladas.sort(
          (a, b) =>
            new Date(b.atualizadaEm).getTime() - new Date(a.atualizadaEm).getTime()
        );
        setConversas(mescladas);
        await persistirConversasLocal(mescladas);
      } catch {
        setConversas(locais);
      }
    } catch {
      setConversas([]);
    } finally {
      setCarregandoHistorico(false);
    }
  }, [user?.id, persistirConversasLocal]);

  useEffect(() => {
    if (visible) {
      carregarHistoricoConversas();
    }
  }, [visible, carregarHistoricoConversas]);

  useEffect(() => {
    if (mensagens.length > 0 || carregando) {
      const t = setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 120);
      return () => clearTimeout(t);
    }
  }, [mensagens, passosAtuais, carregando]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Atualiza ou cria a sessão atual no histórico sempre que uma mensagem é concluída
  const salvarSessaoNoHistorico = useCallback(
    (
       novasMensagens: MensagemChat[],
      idSessaoAtual: string | null,
      idConversaServidor?: number | null
    ): string => {
      const agoraIso = new Date().toISOString();
      const primeiraDoUsuario = novasMensagens.find((m) => m.role === "user");
      const titulo = primeiraDoUsuario
        ? gerarTituloConversa(primeiraDoUsuario.text)
        : "Conversa com OneIA";

      const sessaoId =
        idSessaoAtual ||
        (idConversaServidor ? `srv-${idConversaServidor}` : `chat-${Date.now()}`);

      setConversas((prev) => {
        const idx = prev.findIndex(
          (c) =>
            c.id === sessaoId ||
            (idConversaServidor && c.backendConversaId === idConversaServidor)
        );

        let atualizada: SessaoConversaIA[];
        if (idx >= 0) {
          const itemAtualizado: SessaoConversaIA = {
            ...prev[idx],
            id: sessaoId,
            backendConversaId: idConversaServidor ?? prev[idx].backendConversaId,
            titulo,
            atualizadaEm: agoraIso,
            mensagens: novasMensagens,
          };
          atualizada = [
            itemAtualizado,
            ...prev.filter((_, i) => i !== idx),
          ];
        } else {
          const novaSessao: SessaoConversaIA = {
            id: sessaoId,
            backendConversaId: idConversaServidor ?? undefined,
            titulo,
            criadaEm: agoraIso,
            atualizadaEm: agoraIso,
            mensagens: novasMensagens,
          };
          atualizada = [novaSessao, ...prev];
        }

        persistirConversasLocal(atualizada);
        return atualizada;
      });

      setConversaAtivaId(sessaoId);
      if (idConversaServidor) {
        setBackendConversaId(idConversaServidor);
      }
      return sessaoId;
    },
    [persistirConversasLocal]
  );

  const iniciarNovaConversa = () => {
    if (carregando) return;
    setConversaAtivaId(null);
    setBackendConversaId(null);
    setMensagens([]);
    setPassosAtuais([]);
    setPassosExpandidos({});
    setForcarNovaConversaBackend(true);
    setMenuHistoricoAberto(false);
    setAbaInferior("chat");
  };

  const selecionarConversaDoHistorico = async (sessao: SessaoConversaIA) => {
    if (carregando) return;
    setMenuHistoricoAberto(false);
    setConversaAtivaId(sessao.id);
    setBackendConversaId(sessao.backendConversaId ?? null);
    setForcarNovaConversaBackend(false);
    setPassosExpandidos({});

    if (sessao.mensagens && sessao.mensagens.length > 0) {
      setMensagens(sessao.mensagens);
    }

    // Se a conversa existe no backend, busca os dados atualizados do servidor
    if (sessao.backendConversaId) {
      try {
        setCarregandoHistorico(true);
        const detalhe = await obterConversaIA(sessao.backendConversaId);
        const msgsReconstruidas: MensagemChat[] = [];
        for (const r of detalhe.mensagens || []) {
          if (r.mensagemOriginal) {
            msgsReconstruidas.push({
              id: `usr-${r.realizacaoId}`,
              role: "user",
              text: r.mensagemOriginal,
              criadoEm: r.criadoEm,
            });
          }
          if (r.resposta || r.erro) {
            const passos: PassoIA[] = (r.acoes || []).map((a) => ({
              texto: a.descricao,
              status: (a.status as StatusPassoIA) || "CONCLUIDA",
            }));
            msgsReconstruidas.push({
              id: `ia-${r.realizacaoId}`,
              role: "ia",
              text: r.resposta || r.erro || "",
              erro: r.status === "ERRO",
              passos,
              criadoEm: r.atualizadoEm || r.criadoEm,
            });
          }
        }
        if (msgsReconstruidas.length > 0) {
          setMensagens(msgsReconstruidas);
          salvarSessaoNoHistorico(
            msgsReconstruidas,
            sessao.id,
            sessao.backendConversaId
          );
        }
      } catch {
        // mantém as mensagens locais caso falhe a busca remota
      } finally {
        setCarregandoHistorico(false);
      }
    }
  };

  const excluirConversaDoHistorico = async (sessao: SessaoConversaIA) => {
    if (sessao.backendConversaId) {
      try {
        await excluirConversaIA(sessao.backendConversaId);
      } catch {
        // continua remoção local mesmo se já tiver sido apagada no servidor
      }
    }

    setConversas((prev) => {
      const filtradas = prev.filter((c) => c.id !== sessao.id);
      persistirConversasLocal(filtradas);
      return filtradas;
    });

    if (conversaAtivaId === sessao.id) {
      iniciarNovaConversa();
    }
    notify.info("Conversa removida do histórico.");
  };

  const enviarMensagemTexto = async (mensagemCustom?: string) => {
    const conteudo = (mensagemCustom ?? texto).trim();
    if (!conteudo || carregando) return;

    if (!user?.id) {
      notify.error("Usuário não identificado. Faça login novamente.");
      return;
    }

    if (!mensagemCustom) {
      setTexto("");
    }
    setAbaInferior("chat");

    const idMsgUsuario = `usr-${Date.now()}`;
    const msgUsuario: MensagemChat = {
      id: idMsgUsuario,
      role: "user",
      text: conteudo,
      criadoEm: new Date().toISOString(),
    };

    const listaComUsuario = [...mensagens, msgUsuario];
    setMensagens(listaComUsuario);
    const sessaoIdAtual = salvarSessaoNoHistorico(
      listaComUsuario,
      conversaAtivaId,
      backendConversaId
    );

    setCarregando(true);
    setPassosAtuais([
      { texto: "Enviando solicitação para a OneIA", status: "EM_ANDAMENTO" },
    ]);

    const usarNovaConversa = forcarNovaConversaBackend || !backendConversaId;

    try {
      const { resposta, passos, conversaId: novoBackendId } =
        await conversarComAgenteTexto({
          usuarioId: Number(user.id),
          mensagem: conteudo,
          novaConversa: usarNovaConversa,
          conversaId: usarNovaConversa ? null : backendConversaId,
          onProgresso: (novosPassos) => setPassosAtuais(novosPassos),
        });

      setForcarNovaConversaBackend(false);
      const idMsgIa = `ia-${Date.now()}`;
      const msgIa: MensagemChat = {
        id: idMsgIa,
        role: "ia",
        text: resposta,
        passos,
        criadoEm: new Date().toISOString(),
      };

      const listaFinal = [...listaComUsuario, msgIa];
      setMensagens(listaFinal);
      salvarSessaoNoHistorico(
        listaFinal,
        sessaoIdAtual,
        novoBackendId ?? backendConversaId
      );

      if (passos.length > 0) {
        onAlterado?.();
      }
    } catch (err: any) {
      const msgErro =
        err?.message || "Não foi possível obter resposta da OneIA.";
      const listaErro: MensagemChat[] = [
        ...listaComUsuario,
        {
          id: `err-${Date.now()}`,
          role: "ia",
          text: msgErro,
          erro: true,
          passos: passosAtuais,
          criadoEm: new Date().toISOString(),
        },
      ];
      setMensagens(listaErro);
      salvarSessaoNoHistorico(listaErro, sessaoIdAtual, backendConversaId);
      notify.error(msgErro);
    } finally {
      setCarregando(false);
      setPassosAtuais([]);
    }
  };

  const processarEnvioAudio = async (asset: AudioUploadAsset) => {
    if (!user?.id) {
      notify.error("Usuário não identificado. Faça login novamente.");
      return;
    }

    setAbaInferior("chat");
    const idMsgUsuario = `aud-${Date.now()}`;
    const msgUsuarioInicial: MensagemChat = {
      id: idMsgUsuario,
      role: "user",
      text: "Transcrevendo áudio...",
      viaAudio: true,
      transcrevendo: true,
      criadoEm: new Date().toISOString(),
    };

    const listaInicial = [...mensagens, msgUsuarioInicial];
    setMensagens(listaInicial);
    setCarregando(true);
    setTranscrevendoAudio(true);
    setPassosAtuais([
      {
        texto: "Transcrevendo áudio e enviando para a OneIA",
        status: "EM_ANDAMENTO",
      },
    ]);

    const usarNovaConversa = forcarNovaConversaBackend || !backendConversaId;
    let textoTranscritoFinal = "Áudio enviado";

    try {
      const {
        resposta,
        textoTranscrito,
        passos,
        conversaId: novoBackendId,
      } = await conversarComAgenteAudio({
        usuarioId: Number(user.id),
        audio: asset,
        novaConversa: usarNovaConversa,
        conversaId: usarNovaConversa ? null : backendConversaId,
        onTranscrito: (transcrito) => {
          textoTranscritoFinal = transcrito;
          setTranscrevendoAudio(false);
          setMensagens((prev) =>
            prev.map((m) =>
              m.id === idMsgUsuario
                ? { ...m, text: transcrito, transcrevendo: false }
                : m
            )
          );
        },
        onProgresso: (novosPassos) => {
          setTranscrevendoAudio(false);
          setPassosAtuais(novosPassos);
        },
      });

      setForcarNovaConversaBackend(false);
      const listaAtualizada: MensagemChat[] = [
        ...mensagens,
        {
          id: idMsgUsuario,
          role: "user",
          text: textoTranscrito || textoTranscritoFinal,
          viaAudio: true,
          transcrevendo: false,
          criadoEm: new Date().toISOString(),
        },
        {
          id: `ia-${Date.now()}`,
          role: "ia",
          text: resposta,
          passos,
          criadoEm: new Date().toISOString(),
        },
      ];

      setMensagens(listaAtualizada);
      salvarSessaoNoHistorico(
        listaAtualizada,
        conversaAtivaId,
        novoBackendId ?? backendConversaId
      );

      if (passos.length > 0) {
        onAlterado?.();
      }
    } catch (err: any) {
      const msgErro =
        err?.message || "Falha ao transcrever ou processar o áudio enviado.";
      setMensagens((prev) => [
        ...prev.filter((m) => !(m.id === idMsgUsuario && m.transcrevendo)),
        {
          id: `err-${Date.now()}`,
          role: "ia",
          text: msgErro,
          erro: true,
          criadoEm: new Date().toISOString(),
        },
      ]);
      notify.error(msgErro);
    } finally {
      setTranscrevendoAudio(false);
      setCarregando(false);
      setPassosAtuais([]);
    }
  };

  const iniciarTimer = () => {
    setSegundosGravacao(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSegundosGravacao((s) => s + 1);
    }, 1000);
  };

  const pararTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const iniciarGravacao = async () => {
    if (carregando || gravando) return;

    try {
      if (Platform.OS === "web") {
        if (
          typeof navigator === "undefined" ||
          !navigator.mediaDevices?.getUserMedia ||
          typeof MediaRecorder === "undefined"
        ) {
          notify.error("Seu navegador não suporta gravação direta de áudio.");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType = MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";
        const recorder = new MediaRecorder(stream, { mimeType });
        webChunksRef.current = [];
        recorder.ondataavailable = (e: any) => {
          if (e.data && e.data.size > 0) webChunksRef.current.push(e.data);
        };
        recorder.start();
        webRecorderRef.current = { recorder, stream, mimeType };
        setGravando(true);
        iniciarTimer();
        return;
      }

      const permissao = await AudioModule.requestRecordingPermissionsAsync();
      if (!permissao.granted) {
        notify.error(
          "Permissão de microfone negada. Habilite o microfone nas configurações do dispositivo."
        );
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setGravando(true);
      iniciarTimer();
    } catch (err) {
      console.error("Erro ao iniciar gravação de áudio:", err);
      notify.error("Não foi possível iniciar a gravação de áudio.");
    }
  };

  const cancelarGravacao = async () => {
    pararTimer();
    setGravando(false);
    setSegundosGravacao(0);

    try {
      if (Platform.OS === "web" && webRecorderRef.current) {
        const { recorder, stream } = webRecorderRef.current;
        if (recorder.state !== "inactive") recorder.stop();
        stream.getTracks().forEach((t: any) => t.stop());
        webRecorderRef.current = null;
        webChunksRef.current = [];
        return;
      }

      if (audioRecorder.isRecording) {
        await audioRecorder.stop();
      }
      await setAudioModeAsync({ allowsRecording: false });
    } catch {
      // ignora erro ao abortar gravação
    }
  };

  const finalizarEEnviarGravacao = async () => {
    pararTimer();
    setGravando(false);

    try {
      if (Platform.OS === "web" && webRecorderRef.current) {
        const { recorder, stream, mimeType } = webRecorderRef.current;
        const assetPromise = new Promise<AudioUploadAsset>((resolve, reject) => {
          recorder.onstop = () => {
            stream.getTracks().forEach((t: any) => t.stop());
            const blob = new Blob(webChunksRef.current, { type: mimeType });
            if (blob.size === 0) {
              reject(new Error("O áudio gravado está vazio."));
              return;
            }
            const ext = mimeType.includes("webm") ? "webm" : "m4a";
            const url = URL.createObjectURL(blob);
            resolve({
              uri: url,
              name: `gravacao-${Date.now()}.${ext}`,
              mimeType,
              file: blob,
            });
          };
        });
        recorder.stop();
        webRecorderRef.current = null;
        const asset = await assetPromise;
        await processarEnvioAudio(asset);
        return;
      }

      await audioRecorder.stop();
      await setAudioModeAsync({ allowsRecording: false });

      const uri = audioRecorder.uri;
      if (!uri) {
        notify.error("Não foi possível obter o arquivo da gravação.");
        return;
      }

      await processarEnvioAudio({
        uri,
        name: `gravacao-${Date.now()}.m4a`,
        mimeType: "audio/m4a",
      });
    } catch (err: any) {
      console.error("Erro ao finalizar gravação:", err);
      notify.error(err?.message || "Erro ao processar a gravação de áudio.");
    }
  };

  const telaInicialVazia = mensagens.length === 0 && !carregando;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onFechar}
    >
      <View style={styles.screen}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
        />

        {/* Glow Laranja Atmosférico na parte inferior (inspirado no Gemini, na paleta OnePilates) */}
        <LinearGradient
          colors={
            isDark
              ? [
                  "rgba(10, 10, 14, 0)",
                  "rgba(234, 96, 30, 0.08)",
                  "rgba(234, 96, 30, 0.22)",
                  "rgba(248, 122, 59, 0.38)",
                ]
              : [
                  "rgba(252, 250, 248, 0)",
                  "rgba(248, 122, 59, 0.08)",
                  "rgba(234, 96, 30, 0.18)",
                  "rgba(234, 96, 30, 0.32)",
                ]
          }
          locations={[0, 0.42, 0.76, 1]}
          style={styles.bottomAmbientGlow}
          pointerEvents="none"
        />

        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Top Bar estilo Gemini */}
          <View style={styles.topBar}>
            <View style={styles.topBarLeft}>
              <TouchableOpacity
                style={styles.menuBtn}
                onPress={() => setMenuHistoricoAberto(true)}
                activeOpacity={0.75}
                accessibilityLabel="Abrir histórico de conversas"
              >
                <View style={styles.geminiMenuLines}>
                  <View style={styles.geminiMenuLine} />
                  <View style={[styles.geminiMenuLine, { width: 14 }]} />
                </View>
                {conversas.length > 0 && (
                  <View style={styles.historicoCountDot} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.brandSelector}
                onPress={() => setMenuHistoricoAberto(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.brandNome}>OneIA</Text>
                <Text style={styles.brandModelo}>Studio</Text>
                <Feather
                  name="chevron-down"
                  size={15}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.topBarRight}>
              <TouchableOpacity
                style={[
                  styles.novoChatTopBtn,
                  (carregando || mensagens.length === 0) &&
                    styles.actionBtnDisabled,
                ]}
                onPress={iniciarNovaConversa}
                disabled={carregando || mensagens.length === 0}
                activeOpacity={0.75}
                accessibilityLabel="Iniciar nova conversa"
              >
                <Feather name="edit-3" size={17} color={colors.text} />
              </TouchableOpacity>

              <View style={styles.avatarRing}>
                <View style={styles.avatarInner}>
                  <Text style={styles.avatarTexto}>{iniciaisUsuario}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.fecharTelaBtn}
                onPress={onFechar}
                activeOpacity={0.75}
                accessibilityLabel="Voltar para o aplicativo"
              >
                <Feather name="x" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Corpo Principal: Hero "Por onde começamos?" ou Conversa Ativa */}
          {telaInicialVazia ? (
            <ScrollView
              style={styles.flex1}
              contentContainerStyle={styles.heroScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.heroCenter}>
                <View style={styles.heroStarGlow}>
                  <Text style={styles.heroStarEmoji}>✨</Text>
                </View>

                <Text style={styles.heroSaudacao}>Olá, {primeiroNome}</Text>
                <Text style={styles.heroPergunta}>Por onde começamos?</Text>

                {abaInferior === "sugestoes" && (
                  <View style={styles.sugestoesHeroWrap}>
                    {sugestoes.map((sug, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.sugestaoPill}
                        onPress={() => enviarMensagemTexto(sug)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.sugestaoPillTexto}>{sug}</Text>
                        <Feather
                          name="arrow-up-right"
                          size={15}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          ) : (
            <ScrollView
              ref={scrollRef}
              style={styles.chatBody}
              contentContainerStyle={styles.chatContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {mensagens.map((msg) => {
                const ehUsuario = msg.role === "user";
                const temPassos = Boolean(msg.passos && msg.passos.length > 0);
                const aberto = Boolean(passosExpandidos[msg.id]);

                if (ehUsuario) {
                  return (
                    <View key={msg.id} style={styles.blocoUsuario}>
                      <View style={styles.balaoUsuario}>
                        {msg.viaAudio && (
                          <View style={styles.audioTag}>
                            <Feather name="mic" size={11} color="#fff" />
                            <Text style={styles.audioTagTexto}>
                              {msg.transcrevendo
                                ? "Transcrevendo áudio..."
                                : "Mensagem por áudio"}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.msgUsuarioTexto}>{msg.text}</Text>
                      </View>
                    </View>
                  );
                }

                return (
                  <View key={msg.id} style={styles.blocoIa}>
                    <View style={styles.iaRespostaHeader}>
                      <Text style={styles.iaSparkleMini}>✨</Text>
                      <Text style={styles.iaRespostaLabel}>OneIA</Text>
                    </View>

                    {temPassos && (
                      <View style={styles.resumoPassosBox}>
                        <TouchableOpacity
                          style={styles.resumoPassosHeader}
                          onPress={() =>
                            setPassosExpandidos((prev) => ({
                              ...prev,
                              [msg.id]: !aberto,
                            }))
                          }
                          activeOpacity={0.75}
                        >
                          <Feather
                            name={aberto ? "chevron-up" : "chevron-down"}
                            size={14}
                            color={colors.primary}
                          />
                          <Text style={styles.resumoPassosTitulo}>
                            {msg.passos!.length}{" "}
                            {msg.passos!.length === 1
                              ? "etapa executada"
                              : "etapas executadas"}
                          </Text>
                        </TouchableOpacity>

                        {aberto && (
                          <ListaPassosView
                            passos={msg.passos!}
                            styles={styles}
                            colors={colors}
                          />
                        )}
                      </View>
                    )}

                    <View
                      style={[
                        styles.balaoIa,
                        msg.erro && styles.balaoIaErro,
                      ]}
                    >
                      <ConteudoMensagemIA
                        texto={msg.text}
                        styles={styles}
                        erro={msg.erro}
                      />
                    </View>
                  </View>
                );
              })}

              {carregando && (
                <View style={styles.blocoIa}>
                  <View style={styles.iaRespostaHeader}>
                    <Text style={styles.iaSparkleMini}>✨</Text>
                    <Text style={styles.iaRespostaLabel}>OneIA</Text>
                  </View>
                  <View style={styles.balaoIaCarregando}>
                    {passosAtuais.length > 0 ? (
                      <ListaPassosView
                        passos={passosAtuais}
                        styles={styles}
                        colors={colors}
                      />
                    ) : (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.loadingTexto}>
                          {transcrevendoAudio
                            ? "Transcrevendo seu áudio..."
                            : "Processando sua solicitação..."}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>
          )}

          {/* Seletor estilo Gemini ("Chat" | "Tarefas") + Cápsula Flutuante de Input */}
          <View style={styles.bottomArea}>
            {telaInicialVazia && (
              <View style={styles.modeSwitchRow}>
                <TouchableOpacity
                  style={[
                    styles.modeSwitchPill,
                    abaInferior === "chat" && styles.modeSwitchPillActive,
                  ]}
                  onPress={() => setAbaInferior("chat")}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.modeSwitchText,
                      abaInferior === "chat" && styles.modeSwitchTextActive,
                    ]}
                  >
                    Chat
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modeSwitchPill,
                    abaInferior === "sugestoes" && styles.modeSwitchPillActive,
                  ]}
                  onPress={() =>
                    setAbaInferior((prev) =>
                      prev === "sugestoes" ? "chat" : "sugestoes"
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.modeSwitchText,
                      abaInferior === "sugestoes" && styles.modeSwitchTextActive,
                    ]}
                  >
                    Tarefas
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {gravando ? (
              <View style={styles.gravacaoCapsule}>
                <TouchableOpacity
                  style={styles.btnCancelarGravacao}
                  onPress={cancelarGravacao}
                  activeOpacity={0.8}
                >
                  <Feather name="trash-2" size={18} color={colors.danger} />
                </TouchableOpacity>

                <View style={styles.gravacaoStatus}>
                  <View style={styles.gravacaoDot} />
                  <Text style={styles.gravacaoTexto}>
                    Ouvindo · {formatarDuracao(segundosGravacao)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.btnEnviarGravacao}
                  onPress={finalizarEEnviarGravacao}
                  activeOpacity={0.85}
                >
                  <Feather name="send" size={16} color="#fff" />
                  <Text style={styles.btnEnviarGravacaoTexto}>Enviar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.geminiInputCapsule}>
                <TouchableOpacity
                  style={styles.capsuleLeftBtn}
                  onPress={() => {
                    if (telaInicialVazia) {
                      setAbaInferior((prev) =>
                        prev === "sugestoes" ? "chat" : "sugestoes"
                      );
                    } else {
                      iniciarNovaConversa();
                    }
                  }}
                  disabled={carregando}
                  activeOpacity={0.75}
                  accessibilityLabel="Ações rápidas"
                >
                  <Feather
                    name={
                      telaInicialVazia && abaInferior === "sugestoes"
                        ? "x"
                        : "plus"
                    }
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                <TextInput
                  style={styles.capsuleInput}
                  value={texto}
                  onChangeText={setTexto}
                  placeholder="Peça para a OneIA..."
                  placeholderTextColor={colors.inputPlaceholder}
                  multiline
                  maxLength={1500}
                  editable={!carregando}
                />

                {texto.trim().length > 0 ? (
                  <TouchableOpacity
                    style={[
                      styles.capsuleSendBtn,
                      carregando && styles.actionBtnDisabled,
                    ]}
                    onPress={() => enviarMensagemTexto()}
                    disabled={carregando}
                    activeOpacity={0.85}
                    accessibilityLabel="Enviar mensagem"
                  >
                    <Feather name="arrow-up" size={19} color="#fff" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.capsuleMicBtn,
                      carregando && styles.actionBtnDisabled,
                    ]}
                    onPress={iniciarGravacao}
                    disabled={carregando}
                    activeOpacity={0.85}
                    accessibilityLabel="Gravar áudio"
                  >
                    <Feather name="mic" size={19} color={colors.text} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>

        {/* Gaveta Lateral de Histórico de Conversas */}
        {menuHistoricoAberto && (
          <View style={styles.drawerOverlay}>
            <View style={styles.drawerPanel}>
              <View style={styles.drawerHeader}>
                <View style={styles.drawerBrandRow}>
                  <Text style={styles.drawerSparkle}>✨</Text>
                  <Text style={styles.drawerTitle}>Histórico OneIA</Text>
                </View>
                <TouchableOpacity
                  style={styles.drawerCloseBtn}
                  onPress={() => setMenuHistoricoAberto(false)}
                >
                  <Feather name="x" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.novaConversaDrawerBtn}
                onPress={iniciarNovaConversa}
                activeOpacity={0.85}
              >
                <Feather name="plus" size={17} color="#fff" />
                <Text style={styles.novaConversaDrawerTexto}>Nova conversa</Text>
              </TouchableOpacity>

              <Text style={styles.drawerSectionLabel}>Conversas recentes</Text>

              {carregandoHistorico && conversas.length === 0 ? (
                <View style={styles.drawerEmptyWrap}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : conversas.length === 0 ? (
                <View style={styles.drawerEmptyWrap}>
                  <Feather
                    name="message-square"
                    size={26}
                    color={colors.textMuted}
                  />
                  <Text style={styles.drawerEmptyTitle}>
                    Nenhuma conversa salva
                  </Text>
                  <Text style={styles.drawerEmptySubtitle}>
                    Suas conversas com a OneIA ficarão salvas aqui para você
                    continuar quando quiser.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.flex1}
                  contentContainerStyle={styles.drawerListContent}
                  showsVerticalScrollIndicator={false}
                >
                  {conversas.map((sessao) => {
                    const ativa = sessao.id === conversaAtivaId;
                    return (
                      <View
                        key={sessao.id}
                        style={[
                          styles.drawerItem,
                          ativa && styles.drawerItemAtivo,
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.drawerItemMain}
                          onPress={() => selecionarConversaDoHistorico(sessao)}
                          activeOpacity={0.75}
                        >
                          <Feather
                            name="message-circle"
                            size={15}
                            color={ativa ? colors.primary : colors.textSecondary}
                          />
                          <View style={styles.flex1}>
                            <Text
                              style={[
                                styles.drawerItemTitulo,
                                ativa && styles.drawerItemTituloAtivo,
                              ]}
                              numberOfLines={1}
                            >
                              {sessao.titulo}
                            </Text>
                            <Text style={styles.drawerItemData}>
                              {formatarDataHistorico(sessao.atualizadaEm)}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.drawerDeleteBtn}
                          onPress={() => excluirConversaDoHistorico(sessao)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          accessibilityLabel="Excluir conversa"
                        >
                          <Feather
                            name="trash-2"
                            size={14}
                            color={colors.textMuted}
                          />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            <TouchableOpacity
              style={styles.drawerBackdrop}
              activeOpacity={1}
              onPress={() => setMenuHistoricoAberto(false)}
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

const getStyles = (
  colors: ThemeColors,
  isDark: boolean,
  topInset: number,
  bottomInset: number
) => {
  const paddingTopSeguro =
    Math.max(topInset, Platform.OS === "android" ? StatusBar.currentHeight || 28 : 16) + 8;
  const paddingBottomSeguro = Math.max(bottomInset, 16);

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: isDark ? "#09090d" : "#fcfaf8",
    },

    flex1: {
      flex: 1,
    },

    bottomAmbientGlow: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "48%",
    },

    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: paddingTopSeguro,
      paddingBottom: 12,
      paddingHorizontal: 18,
    },

    topBarLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },

    menuBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },

    geminiMenuLines: {
      gap: 5,
      alignItems: "flex-start",
    },

    geminiMenuLine: {
      width: 19,
      height: 2,
      borderRadius: 1,
      backgroundColor: colors.text,
    },

    historicoCountDot: {
      position: "absolute",
      top: 9,
      right: 8,
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: colors.primary,
    },

    brandSelector: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    brandNome: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: -0.2,
    },

    brandModelo: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.textSecondary,
    },

    topBarRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    novoChatTopBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: isDark ? "rgba(255,255,255,0.28)" : "rgba(15,23,42,0.22)",
      alignItems: "center",
      justifyContent: "center",
    },

    avatarRing: {
      width: 36,
      height: 36,
      borderRadius: 18,
      padding: 2,
      borderWidth: 1.5,
      borderColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },

    avatarInner: {
      width: "100%",
      height: "100%",
      borderRadius: 16,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },

    avatarTexto: {
      fontSize: 12,
      fontWeight: "800",
      color: colors.primary,
    },

    fecharTelaBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },

    heroScrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 28,
      paddingBottom: 24,
    },

    heroCenter: {
      alignItems: "center",
      justifyContent: "center",
    },

    heroStarGlow: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: isDark
        ? "rgba(234, 96, 30, 0.14)"
        : "rgba(234, 96, 30, 0.1)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 18,
    },

    heroStarEmoji: {
      fontSize: 30,
    },

    heroSaudacao: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.primary,
      marginBottom: 6,
    },

    heroPergunta: {
      fontSize: 27,
      fontWeight: "600",
      color: colors.text,
      textAlign: "center",
      letterSpacing: -0.4,
    },

    sugestoesHeroWrap: {
      width: "100%",
      marginTop: 26,
      gap: 9,
    },

    sugestaoPill: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: isDark
        ? "rgba(255, 255, 255, 0.06)"
        : "rgba(255, 255, 255, 0.85)",
      borderWidth: 1,
      borderColor: isDark
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(234, 96, 30, 0.18)",
      paddingHorizontal: 16,
      paddingVertical: 13,
      borderRadius: 16,
      gap: 10,
    },

    sugestaoPillTexto: {
      flex: 1,
      fontSize: 13.5,
      fontWeight: "600",
      color: colors.text,
    },

    chatBody: {
      flex: 1,
    },

    chatContent: {
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 24,
      gap: 18,
    },

    blocoUsuario: {
      alignSelf: "flex-end",
      maxWidth: "84%",
    },

    balaoUsuario: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 20,
      borderBottomRightRadius: 6,
    },

    audioTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginBottom: 4,
      opacity: 0.92,
    },

    audioTagTexto: {
      fontSize: 11,
      fontWeight: "700",
      color: "#fff",
    },

    msgUsuarioTexto: {
      color: "#ffffff",
      fontSize: 14.5,
      lineHeight: 21,
    },

    blocoIa: {
      alignSelf: "flex-start",
      width: "94%",
      maxWidth: "94%",
      gap: 8,
    },

    iaRespostaHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingLeft: 2,
    },

    iaSparkleMini: {
      fontSize: 14,
    },

    iaRespostaLabel: {
      fontSize: 12.5,
      fontWeight: "700",
      color: colors.textSecondary,
    },

    balaoIa: {
      alignSelf: "flex-start",
      maxWidth: "100%",
      backgroundColor: isDark
        ? "rgba(28, 28, 36, 0.88)"
        : "rgba(255, 255, 255, 0.92)",
      borderWidth: 1,
      borderColor: isDark
        ? "rgba(255, 255, 255, 0.08)"
        : "rgba(226, 232, 240, 0.9)",
      paddingHorizontal: 15,
      paddingVertical: 13,
      borderRadius: 18,
      borderTopLeftRadius: 6,
    },

    balaoIaErro: {
      backgroundColor: colors.dangerBg,
      borderColor: colors.dangerBorder,
    },

    balaoIaCarregando: {
      width: "100%",
      maxWidth: "100%",
      overflow: "hidden",
      backgroundColor: isDark
        ? "rgba(28, 28, 36, 0.88)"
        : "rgba(255, 255, 255, 0.92)",
      borderWidth: 1,
      borderColor: isDark
        ? "rgba(255, 255, 255, 0.08)"
        : "rgba(226, 232, 240, 0.9)",
      paddingHorizontal: 15,
      paddingVertical: 13,
      borderRadius: 18,
      borderTopLeftRadius: 6,
      minWidth: 210,
    },

    msgIaTexto: {
      color: colors.text,
      fontSize: 14.5,
      lineHeight: 22,
    },

    msgIaBold: {
      fontWeight: "800",
      color: colors.text,
    },

    msgIaItalic: {
      fontStyle: "italic",
      color: colors.textSecondary,
    },

    msgErroTexto: {
      color: colors.danger,
      fontWeight: "600",
    },

    htmlContainer: {
      gap: 8,
    },

    htmlHeading: {
      fontSize: 15.5,
      fontWeight: "800",
      color: colors.text,
      marginTop: 2,
    },

    htmlList: {
      gap: 6,
      paddingLeft: 2,
    },

    htmlListItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 7,
    },

    htmlListBullet: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.primary,
      lineHeight: 22,
      minWidth: 14,
    },

    htmlTable: {
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: 10,
      overflow: "hidden",
      marginTop: 4,
    },

    htmlTableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
      paddingVertical: 7,
      paddingHorizontal: 8,
      gap: 8,
    },

    htmlTableHeaderRow: {
      backgroundColor: colors.primaryLight,
    },

    htmlTableCell: {
      flex: 1,
      fontSize: 12.5,
      color: colors.text,
    },

    htmlTableHeaderCell: {
      fontWeight: "700",
      color: colors.primary,
    },

    resumoPassosBox: {
      width: "100%",
      maxWidth: "100%",
      overflow: "hidden",
      backgroundColor: isDark
        ? "rgba(255, 255, 255, 0.04)"
        : "rgba(255, 255, 255, 0.85)",
      borderWidth: 1,
      borderColor: isDark
        ? "rgba(255, 255, 255, 0.08)"
        : colors.borderSubtle,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },

    resumoPassosHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    resumoPassosTitulo: {
      flex: 1,
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
    },

    passosScroll: {
      maxHeight: 190,
      width: "100%",
    },

    passosLista: {
      width: "100%",
      gap: 7,
      marginTop: 7,
      paddingRight: 2,
    },

    passoItem: {
      width: "100%",
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },

    passoIconeWrap: {
      width: 18,
      height: 18,
      marginTop: 1,
      flexShrink: 0,
      alignItems: "center",
      justifyContent: "center",
    },

    passoTexto: {
      flex: 1,
      flexShrink: 1,
      fontSize: 12.5,
      lineHeight: 18,
      color: colors.textSecondary,
    },

    passoTextoAtivo: {
      color: colors.text,
      fontWeight: "600",
    },

    loadingRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    loadingTexto: {
      flex: 1,
      flexShrink: 1,
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: "600",
    },

    bottomArea: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: paddingBottomSeguro,
      gap: 12,
    },

    modeSwitchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },

    modeSwitchPill: {
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 20,
    },

    modeSwitchPillActive: {
      backgroundColor: isDark
        ? "rgba(255, 255, 255, 0.14)"
        : "rgba(234, 96, 30, 0.15)",
    },

    modeSwitchText: {
      fontSize: 13.5,
      fontWeight: "600",
      color: colors.textSecondary,
    },

    modeSwitchTextActive: {
      color: isDark ? "#ffffff" : colors.primary,
      fontWeight: "700",
    },

    geminiInputCapsule: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark
        ? "rgba(26, 26, 34, 0.94)"
        : "rgba(255, 255, 255, 0.95)",
      borderWidth: 1,
      borderColor: isDark
        ? "rgba(255, 255, 255, 0.12)"
        : "rgba(234, 96, 30, 0.22)",
      borderRadius: 30,
      paddingHorizontal: 10,
      paddingVertical: 6,
      minHeight: 56,
      gap: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.35 : 0.08,
      shadowRadius: 14,
      elevation: 6,
    },

    capsuleLeftBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },

    capsuleInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      paddingVertical: 8,
      maxHeight: 104,
    },

    capsuleMicBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
    },

    capsuleSendBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },

    actionBtnDisabled: {
      opacity: 0.4,
    },

    gravacaoCapsule: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: isDark
        ? "rgba(26, 26, 34, 0.96)"
        : "rgba(255, 255, 255, 0.96)",
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 30,
      paddingHorizontal: 12,
      paddingVertical: 8,
      minHeight: 56,
      gap: 10,
    },

    btnCancelarGravacao: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.dangerBg,
      alignItems: "center",
      justifyContent: "center",
    },

    gravacaoStatus: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    gravacaoDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.danger,
    },

    gravacaoTexto: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },

    btnEnviarGravacao: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
    },

    btnEnviarGravacaoTexto: {
      color: "#fff",
      fontSize: 13.5,
      fontWeight: "700",
    },

    drawerOverlay: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: "row",
      zIndex: 50,
    },

    drawerPanel: {
      width: "80%",
      maxWidth: 320,
      backgroundColor: isDark ? "#121218" : "#ffffff",
      paddingTop: paddingTopSeguro,
      paddingBottom: paddingBottomSeguro,
      paddingHorizontal: 16,
      borderRightWidth: 1,
      borderRightColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 6, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 14,
    },

    drawerBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.55)",
    },

    drawerHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 18,
    },

    drawerBrandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    drawerSparkle: {
      fontSize: 18,
    },

    drawerTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: colors.text,
    },

    drawerCloseBtn: {
      padding: 6,
      borderRadius: 10,
    },

    novaConversaDrawerBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 14,
      marginBottom: 18,
    },

    novaConversaDrawerTexto: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "700",
    },

    drawerSectionLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 10,
      paddingHorizontal: 4,
    },

    drawerListContent: {
      gap: 6,
      paddingBottom: 20,
    },

    drawerItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: "transparent",
      gap: 8,
    },

    drawerItemAtivo: {
      backgroundColor: colors.primaryLight,
    },

    drawerItemMain: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    drawerItemTitulo: {
      fontSize: 13.5,
      fontWeight: "600",
      color: colors.text,
    },

    drawerItemTituloAtivo: {
      fontWeight: "800",
      color: colors.primary,
    },

    drawerItemData: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },

    drawerDeleteBtn: {
      padding: 6,
      borderRadius: 8,
    },

    drawerEmptyWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
      gap: 8,
    },

    drawerEmptyTitle: {
      fontSize: 14.5,
      fontWeight: "700",
      color: colors.text,
      marginTop: 4,
    },

    drawerEmptySubtitle: {
      fontSize: 12.5,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 18,
    },
  });
};
