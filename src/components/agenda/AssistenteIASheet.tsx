import React, { useEffect, useMemo, useRef, useState } from "react";
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
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, ThemeColors } from "@/contexts/ThemeContext";
import {
  conversarComAgenteTexto,
  conversarComAgenteAudio,
  PassoIA,
  AudioUploadAsset,
} from "@/services/ia";
import { notify } from "@/utils/notify";

interface Props {
  visible: boolean;
  onFechar: () => void;
  onAlterado?: () => void;
}

interface MensagemChat {
  id: string;
  role: "user" | "ia";
  text: string;
  viaAudio?: boolean;
  transcrevendo?: boolean;
  erro?: boolean;
  passos?: PassoIA[];
}

const SUGESTOES_SECRETARIA = [
  "Quais aulas temos hoje?",
  "Quais aulas estão marcadas nesta semana?",
  "Listar professores e salas disponíveis",
  "Resumo do estúdio nos últimos 30 dias",
];

const SUGESTOES_PROFESSOR = [
  "Quais são as minhas aulas de hoje?",
  "Minhas aulas desta semana",
  "Meu desempenho nos últimos 30 dias",
  "Listar minhas ausências registradas",
];

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
  ).trim();
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
  const normalizado = decodificarEntidades(html.replace(/<br\s*\/?>/gi, "\n"));
  const partes = normalizado.split(/(<(?:strong|b|em|i)>[\s\S]*?<\/(?:strong|b|em|i)>)/gi);

  return (
    <Text style={style}>
      {partes.map((parte, idx) => {
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
 * Converte a resposta da IA (texto puro ou HTML estruturado do AgentService)
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
  const temHtml = /<\/?[a-z][a-z0-9]*[^>]*>/i.test(texto);

  if (!temHtml || erro) {
    return (
      <Text style={[styles.msgIaTexto, erro && styles.msgErroTexto]}>
        {decodificarEntidades(texto)}
      </Text>
    );
  }

  const blocosRegex =
    /<(h3|h4|p|ul|ol|table)[^>]*>([\s\S]*?)<\/\1>/gi;
  const blocos: { tipo: string; conteudo: string }[] = [];
  let ultimoIndice = 0;
  let match: RegExpExecArray | null;

  while ((match = blocosRegex.exec(texto)) !== null) {
    if (match.index > ultimoIndice) {
      const solto = texto.slice(ultimoIndice, match.index).trim();
      if (solto) {
        blocos.push({ tipo: "p", conteudo: solto });
      }
    }
    blocos.push({ tipo: match[1].toLowerCase(), conteudo: match[2] });
    ultimoIndice = blocosRegex.lastIndex;
  }

  if (ultimoIndice < texto.length) {
    const restante = texto.slice(ultimoIndice).trim();
    if (restante) {
      blocos.push({ tipo: "p", conteudo: restante });
    }
  }

  if (blocos.length === 0) {
    return (
      <TextoFormatadoInline
        html={texto}
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
            <Text key={idx} style={styles.htmlHeading}>
              {limparTagsInline(bloco.conteudo)}
            </Text>
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
  return (
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
              {p.texto}
            </Text>
          </View>
        );
      })}
    </View>
  );
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
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const mensagemBoasVindas: MensagemChat = useMemo(
    () => ({
      id: "welcome",
      role: "ia",
      text: `Olá${user?.nome ? `, ${user.nome.split(" ")[0]}` : ""}! Sou o Assistente One. Você pode escrever ou enviar um áudio para consultar a agenda, criar ou editar aulas, verificar observações de alunos e acompanhar indicadores do estúdio.`,
    }),
    [user?.nome]
  );

  const [mensagens, setMensagens] = useState<MensagemChat[]>([
    mensagemBoasVindas,
  ]);
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [transcrevendoAudio, setTranscrevendoAudio] = useState(false);
  const [passosAtuais, setPassosAtuais] = useState<PassoIA[]>([]);
  const [passosExpandidos, setPassosExpandidos] = useState<
    Record<string, boolean>
  >({});

  // Estados de gravação de áudio
  const [gravando, setGravando] = useState(false);
  const [segundosGravacao, setSegundosGravacao] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const webRecorderRef = useRef<any>(null);
  const webChunksRef = useRef<BlobPart[]>([]);
  const timerGravacaoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollRef = useRef<ScrollView | null>(null);
  const novaConversaRef = useRef(false);

  const sugestoes =
    user?.role === "PROFESSOR" ? SUGESTOES_PROFESSOR : SUGESTOES_SECRETARIA;

  const rolarParaFim = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
  };

  useEffect(() => {
    if (visible) {
      rolarParaFim();
    }
  }, [mensagens, carregando, passosAtuais, visible]);

  // Limpa gravação ativa se o modal for fechado
  useEffect(() => {
    if (!visible && gravando) {
      cancelarGravacao();
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      if (timerGravacaoRef.current) {
        clearInterval(timerGravacaoRef.current);
      }
    };
  }, []);

  const iniciarTimer = () => {
    setSegundosGravacao(0);
    if (timerGravacaoRef.current) clearInterval(timerGravacaoRef.current);
    timerGravacaoRef.current = setInterval(() => {
      setSegundosGravacao((s) => s + 1);
    }, 1000);
  };

  const pararTimer = () => {
    if (timerGravacaoRef.current) {
      clearInterval(timerGravacaoRef.current);
      timerGravacaoRef.current = null;
    }
  };

  const limparConversa = () => {
    if (carregando) return;
    setMensagens([mensagemBoasVindas]);
    setPassosExpandidos({});
    novaConversaRef.current = true;
  };

  const enviarMensagemTexto = async (textoEnvio?: string) => {
    const conteudo = (textoEnvio ?? texto).trim();
    if (!conteudo || carregando || !user?.id) return;

    const idMsgUser = `user-${Date.now()}`;
    setMensagens((prev) => [
      ...prev,
      { id: idMsgUser, role: "user", text: conteudo },
    ]);
    if (!textoEnvio) setTexto("");
    setPassosAtuais([
      { texto: "Enviando solicitação ao assistente", status: "EM_ANDAMENTO" },
    ]);
    setCarregando(true);

    let ultimosPassos: PassoIA[] = [];
    try {
      const { resposta, passos } = await conversarComAgenteTexto({
        usuarioId: user.id,
        mensagem: conteudo,
        novaConversa: novaConversaRef.current,
        onProgresso: (lista) => {
          ultimosPassos = lista;
          setPassosAtuais(lista);
        },
      });
      novaConversaRef.current = false;

      const passosFinais = passos.length > 0 ? passos : ultimosPassos;
      setMensagens((prev) => [
        ...prev,
        {
          id: `ia-${Date.now()}`,
          role: "ia",
          text: resposta || "O assistente concluiu o seu pedido.",
          passos: passosFinais,
        },
      ]);
      onAlterado?.();
    } catch (err: any) {
      setMensagens((prev) => [
        ...prev,
        {
          id: `ia-err-${Date.now()}`,
          role: "ia",
          text:
            err?.message ||
            "Não foi possível processar sua mensagem. Tente novamente.",
          erro: true,
          passos: ultimosPassos,
        },
      ]);
    } finally {
      setCarregando(false);
      setPassosAtuais([]);
    }
  };

  const processarEnvioAudio = async (asset: AudioUploadAsset) => {
    if (!user?.id || carregando) return;

    const idMsgUser = `user-audio-${Date.now()}`;
    setMensagens((prev) => [
      ...prev,
      {
        id: idMsgUser,
        role: "user",
        text: "Transcrevendo áudio...",
        viaAudio: true,
        transcrevendo: true,
      },
    ]);
    setTranscrevendoAudio(true);
    setCarregando(true);
    setPassosAtuais([
      { texto: "Transcrevendo áudio enviado", status: "EM_ANDAMENTO" },
    ]);

    let ultimosPassos: PassoIA[] = [];
    try {
      const { resposta, textoTranscrito, passos } =
        await conversarComAgenteAudio({
          usuarioId: user.id,
          audio: asset,
          novaConversa: novaConversaRef.current,
          onTranscrito: (transcricao) => {
            setTranscrevendoAudio(false);
            setMensagens((prev) =>
              prev.map((m) =>
                m.id === idMsgUser
                  ? { ...m, text: transcricao, transcrevendo: false }
                  : m
              )
            );
            setPassosAtuais([
              { texto: "Analisando o seu pedido", status: "EM_ANDAMENTO" },
            ]);
          },
          onProgresso: (lista) => {
            ultimosPassos = lista;
            setPassosAtuais(lista);
          },
        });

      novaConversaRef.current = false;
      const passosFinais = passos.length > 0 ? passos : ultimosPassos;

      setMensagens((prev) => [
        ...prev.map((m) =>
          m.id === idMsgUser
            ? { ...m, text: textoTranscrito, transcrevendo: false }
            : m
        ),
        {
          id: `ia-${Date.now()}`,
          role: "ia",
          text: resposta || "O assistente concluiu o seu pedido.",
          passos: passosFinais,
        },
      ]);
      onAlterado?.();
    } catch (err: any) {
      setTranscrevendoAudio(false);
      setMensagens((prev) => {
        const atualizadas = prev.map((m) =>
          m.id === idMsgUser && m.transcrevendo
            ? { ...m, text: "Áudio enviado (falha na transcrição)", transcrevendo: false }
            : m
        );
        return [
          ...atualizadas,
          {
            id: `ia-err-${Date.now()}`,
            role: "ia",
            text:
              err?.message ||
              "Não foi possível transcrever ou processar o áudio enviado.",
            erro: true,
            passos: ultimosPassos,
          },
        ];
      });
    } finally {
      setTranscrevendoAudio(false);
      setCarregando(false);
      setPassosAtuais([]);
    }
  };

  const iniciarGravacao = async () => {
    if (carregando || gravando) return;

    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType =
          typeof MediaRecorder !== "undefined" &&
          MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "audio/mp4";
        const recorder = new MediaRecorder(stream, { mimeType });
        webChunksRef.current = [];
        recorder.ondataavailable = (e: any) => {
          if (e.data && e.data.size > 0) {
            webChunksRef.current.push(e.data);
          }
        };
        recorder.start();
        webRecorderRef.current = { recorder, stream, mimeType };
        setGravando(true);
        iniciarTimer();
        return;
      }

      const permissao = await Audio.requestPermissionsAsync();
      if (!permissao.granted) {
        notify.error(
          "Permissão de microfone negada. Habilite o microfone nas configurações do dispositivo."
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
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

      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        recordingRef.current = null;
      }
    } catch {
      recordingRef.current = null;
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

      const recording = recordingRef.current;
      if (!recording) return;
      recordingRef.current = null;

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();
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

  const selecionarArquivoAudio = async () => {
    if (carregando || gravando) return;

    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        type: ["audio/*"],
        copyToCacheDirectory: true,
      });

      if (resultado.canceled || !resultado.assets?.length) {
        return;
      }

      const arquivo = resultado.assets[0];
      await processarEnvioAudio({
        uri: arquivo.uri,
        name: arquivo.name || `audio-${Date.now()}.m4a`,
        mimeType: arquivo.mimeType || "audio/m4a",
        file: (arquivo as any).file,
      });
    } catch (err) {
      console.error("Erro ao selecionar arquivo de áudio:", err);
      notify.error("Não foi possível carregar o arquivo de áudio selecionado.");
    }
  };

  const mostrarSugestoes = mensagens.length <= 1 && !carregando;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onFechar}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity
          style={styles.overlayTop}
          activeOpacity={1}
          onPress={onFechar}
        />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iaBadgeIcon}>
                <Feather name="cpu" size={18} color={colors.primary} />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.titulo}>Assistente One</Text>
                <Text style={styles.subtitulo}>
                  Inteligência Artificial · Texto e Voz
                </Text>
              </View>
            </View>

            <View style={styles.headerAcoes}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={limparConversa}
                disabled={carregando || mensagens.length <= 1}
              >
                <Feather
                  name="trash-2"
                  size={18}
                  color={
                    carregando || mensagens.length <= 1
                      ? colors.textMuted
                      : colors.textSecondary
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconBtn} onPress={onFechar}>
                <Feather name="x" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Mensagens do Chat */}
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

            {/* Sugestões Rápidas */}
            {mostrarSugestoes && (
              <View style={styles.sugestoesContainer}>
                <Text style={styles.sugestoesLabel}>Sugestões rápidas</Text>
                <View style={styles.sugestoesGrid}>
                  {sugestoes.map((sug, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.sugestaoChip}
                      onPress={() => enviarMensagemTexto(sug)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.sugestaoTexto}>{sug}</Text>
                      <Feather
                        name="arrow-up-right"
                        size={13}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Indicador de carregamento com progresso em tempo real */}
            {carregando && (
              <View style={styles.blocoIa}>
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

          {/* Rodapé: Campo de Texto + Gravação/Envio de Áudio */}
          <View style={styles.footer}>
            {gravando ? (
              <View style={styles.gravacaoContainer}>
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
                    Gravando áudio · {formatarDuracao(segundosGravacao)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.btnEnviarGravacao}
                  onPress={finalizarEEnviarGravacao}
                  activeOpacity={0.85}
                >
                  <Feather name="send" size={17} color="#fff" />
                  <Text style={styles.btnEnviarGravacaoTexto}>Enviar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={texto}
                    onChangeText={setTexto}
                    placeholder="Escreva ou grave um pedido para a IA..."
                    placeholderTextColor={colors.inputPlaceholder}
                    multiline
                    maxLength={1500}
                    editable={!carregando}
                  />

                  <TouchableOpacity
                    style={styles.attachAudioBtn}
                    onPress={selecionarArquivoAudio}
                    disabled={carregando}
                    activeOpacity={0.75}
                  >
                    <Feather
                      name="paperclip"
                      size={18}
                      color={
                        carregando ? colors.textMuted : colors.textSecondary
                      }
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.actionBtnMic,
                    carregando && styles.actionBtnDisabled,
                  ]}
                  onPress={iniciarGravacao}
                  disabled={carregando}
                  activeOpacity={0.85}
                  accessibilityLabel="Gravar áudio"
                >
                  <Feather name="mic" size={18} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionBtnPrimary,
                    (carregando || !texto.trim()) && styles.actionBtnDisabled,
                  ]}
                  onPress={() => enviarMensagemTexto()}
                  disabled={carregando || !texto.trim()}
                  activeOpacity={0.85}
                  accessibilityLabel="Enviar mensagem"
                >
                  <Feather name="send" size={17} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: isDark ? "rgba(0,0,0,0.72)" : "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },

    overlayTop: { flex: 1 },

    sheet: {
      backgroundColor: colors.surfaceCard,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: isDark ? 1 : 0,
      borderTopColor: colors.border,
      height: "86%",
      maxHeight: "92%",
    },

    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.borderSubtle,
      alignSelf: "center",
      marginTop: 10,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    headerLeft: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },

    iaBadgeIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: isDark
        ? "rgba(234, 96, 30, 0.35)"
        : "rgba(234, 96, 30, 0.2)",
      alignItems: "center",
      justifyContent: "center",
    },

    flex1: { flex: 1 },

    titulo: {
      fontSize: 17,
      fontWeight: "800",
      color: colors.text,
    },

    subtitulo: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },

    headerAcoes: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },

    iconBtn: {
      padding: 8,
      borderRadius: 10,
    },

    chatBody: {
      flex: 1,
    },

    chatContent: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 14,
    },

    blocoUsuario: {
      alignSelf: "flex-end",
      maxWidth: "84%",
    },

    balaoUsuario: {
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 16,
      borderBottomRightRadius: 4,
    },

    audioTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginBottom: 4,
      opacity: 0.9,
    },

    audioTagTexto: {
      fontSize: 11,
      fontWeight: "700",
      color: "#fff",
    },

    msgUsuarioTexto: {
      color: "#ffffff",
      fontSize: 14,
      lineHeight: 20,
    },

    blocoIa: {
      alignSelf: "flex-start",
      maxWidth: "90%",
      gap: 6,
    },

    balaoIa: {
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 16,
      borderBottomLeftRadius: 4,
    },

    balaoIaErro: {
      backgroundColor: colors.dangerBg,
      borderColor: colors.dangerBorder,
    },

    balaoIaCarregando: {
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 16,
      borderBottomLeftRadius: 4,
      minWidth: 210,
    },

    msgIaTexto: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 21,
    },

    msgIaBold: {
      fontWeight: "700",
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
      fontSize: 15,
      fontWeight: "800",
      color: colors.text,
      marginTop: 2,
    },

    htmlList: {
      gap: 5,
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
      lineHeight: 21,
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
      backgroundColor: colors.surfaceCard,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: 12,
      paddingHorizontal: 11,
      paddingVertical: 7,
    },

    resumoPassosHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    resumoPassosTitulo: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
    },

    passosLista: {
      gap: 6,
      marginTop: 6,
    },

    passoItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    passoIconeWrap: {
      width: 16,
      height: 16,
      alignItems: "center",
      justifyContent: "center",
    },

    passoTexto: {
      flex: 1,
      fontSize: 12.5,
      color: colors.textSecondary,
    },

    passoTextoAtivo: {
      color: colors.text,
      fontWeight: "600",
    },

    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    loadingTexto: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: "600",
    },

    sugestoesContainer: {
      marginTop: 6,
      gap: 8,
    },

    sugestoesLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textMuted,
      paddingHorizontal: 2,
    },

    sugestoesGrid: {
      gap: 8,
    },

    sugestaoChip: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 12,
      gap: 8,
    },

    sugestaoTexto: {
      flex: 1,
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
    },

    footer: {
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: Platform.OS === "ios" ? 26 : 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surfaceCard,
    },

    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
    },

    inputContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.inputBg,
      borderWidth: 1.5,
      borderColor: colors.inputBorder,
      borderRadius: 16,
      paddingLeft: 14,
      paddingRight: 6,
      paddingVertical: 4,
      minHeight: 46,
      maxHeight: 110,
    },

    input: {
      flex: 1,
      fontSize: 14,
      color: colors.inputText,
      paddingVertical: 6,
      maxHeight: 96,
    },

    attachAudioBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },

    actionBtnPrimary: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },

    actionBtnMic: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primaryLight,
      borderWidth: 1.5,
      borderColor: isDark
        ? "rgba(234, 96, 30, 0.45)"
        : "rgba(234, 96, 30, 0.3)",
      alignItems: "center",
      justifyContent: "center",
    },

    actionBtnDisabled: {
      opacity: 0.5,
    },

    gravacaoContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: 16,
      paddingHorizontal: 10,
      paddingVertical: 8,
      gap: 10,
    },

    btnCancelarGravacao: {
      width: 38,
      height: 38,
      borderRadius: 19,
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
      fontSize: 13.5,
      fontWeight: "700",
      color: colors.text,
    },

    btnEnviarGravacao: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 12,
    },

    btnEnviarGravacaoTexto: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "700",
    },
  });
