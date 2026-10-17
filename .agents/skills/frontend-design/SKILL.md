---
name: frontend-design
description: Guia de engenharia de software e design de interfaces para criar telas e componentes de alto padrão, eliminando vícios de "IA Slop", clichês visuais e soluções genéricas em React e React Native.
---

# Frontend & Mobile Engineering: Padrão de Alta Fidelidade (Anti-IA Slop)

Este skill define o padrão de engenharia e refinamento visual obrigatório para a criação de componentes, telas, modais e fluxos de usuário. O objetivo é assegurar interfaces com qualidade de produto final de nível internacional, eliminando vícios comuns de código gerado por inteligência artificial ("IA Slop").

---

## 1. Postura de Engenharia: Engenheiro Especialista de Produto

Ao criar ou refatorar qualquer componente de interface:
- **Você é um Engenheiro de Software Sênior especialista em Design Systems, UX e Mobile/Frontend nativo.**
- **Não entregue rascunhos, placeholders ou código preguiçoso.** Todo componente deve estar pronto para produção, com tratamento de acessibilidade, estados de interação, performance de 60/120 FPS e alinhamento visceral à marca.
- **Entenda a alma do projeto antes de digitar uma linha de código:**
  - Qual é a paleta real do sistema? (Ex: gradientes acetinados quentes `#f87a3b` -> `#ea601e`, pretos profundos obsidian `#0c0c0e`, brancos límpidos `#ffffff`).
  - Qual é o público e o tom? (Saúde, performance, bem-estar, sofisticação, estúdio boutique).
  - Nunca invente cores fora da identidade visual estabelecida.

---

## 2. A "Lista Negra" do IA Slop (O que NUNCA Fazer)

Identifique e recuse os seguintes vícios que denunciam interfaces amadoras ou geradas sem critério:

### ❌ 1. Badges e Pílulas Flutuantes Sem Função
- **O erro:** Colocar tags em formato de pílula (ex: `[ PRIMEIRO ACESSO ]`, `[ ACESSO RESTRITO ]`) flutuando aleatoriamente acima de títulos apenas para "preencher espaço".
- **A solução:** Deixe a hierarquia tipográfica falar por si. Se o contexto exige uma instrução, use títulos fortes, subtítulos explicativos elegantes ou cartões estruturados.

### ❌ 2. Bordas Laterais de Alerta estilo "Blockquote" (`borderLeftWidth`)
- **O erro:** Criar caixas informativas com uma linha grossa à esquerda (`borderLeftWidth: 3px` ou `4px`) com fundo translúcido desbotado. Isso é visual de documentação técnica ou Markdown de blog de 2012, não de um app moderno.
- **A solução:** Use cartões com bordas sutis completas de 1px (`rgba(..., 0.08)`), fundos com acabamento fosco/acrílico, ícones com contraste equilibrado e tipografia limpa.

### ❌ 3. Animações Infinitas Sem Sentido ("Bobbing/Floating")
- **O erro:** Deixar logos ou elementos flutuando indefinidamente para cima e para baixo em loop contínuo (`translateY` infinito). Isso cansa a vista e dá aparência de joguinho barato ou template de baixa qualidade.
- **A solução:** Microinterações com propósito. Animações de entrada suaves com física elástica (*spring reveals*, *staggered fades*) que executam **uma única vez** no carregamento e estabilizam a tela para o uso humano.

### ❌ 4. Popups Centrais de FAQ com Marcadores (`•`) e Números Genéricos
- **O erro:** Modais flutuando no meio da tela com perguntas automáticas (*"Quem concede o acesso?"*, *"O que fazer agora?"*), listas de bullets (`•`) e círculos com `1, 2, 3`.
- **A solução:** 
  - Em mobile, priorize **Bottom Sheets** deslizantes nativos (`animationType="slide"` partindo da base da tela).
  - Apresente a informação por meio de cartões organizados por função (ex: perfis de acesso, passos objetivos), ícones contextualizados e linguagem acolhedora e direta.

### ❌ 5. Gradientes Clichês de IA
- **O erro:** Usar o clássico gradiente roxo/violeta em fundo branco de templates padrão de Tailwind.
- **A solução:** Use combinações autorais e bem pensadas. Explore contrastes profundos, efeitos de iluminação ambiente suave (*ambient glow*) que não atrapalhem a leitura, e gradientes direcionados com highlights de 1px nas bordas superiores.

### ❌ 6. Modais Nativos Crús e Secos (`Alert.alert`)
- **O erro:** Disparar caixas de alerta cinzas e quadradas do sistema operacional no meio de uma aplicação com identidade visual customizada.
- **A solução:** Conectar todas as mensagens de erro, sucesso ou validação a modais temáticos do design system da aplicação, com botões táteis e ícones com significado.

### ❌ 7. Bloqueio de Toques e Inputs (Touch Trap)
- **O erro:** Envolver formulários em `TouchableWithoutFeedback` mal configurados ou posicionar efeitos de fundo/brilho sem `pointerEvents="none"`, impedindo o usuário de clicar nos inputs de primeira.
- **A solução:** 
  - Camadas decorativas absolutas **sempre** com `pointerEvents="none"`.
  - Em listas e formulários móveis, utilize `ScrollView` com `keyboardShouldPersistTaps="handled"`.

### ❌ 8. Desrespeito a Câmeras e Safe Areas
- **O erro:** Usar espaçamentos fixos pequenos no topo (ex: `paddingTop: 20`), fazendo botões de retorno ou logos colidirem com câmeras frontais *punch-hole* (ex: Galaxy S24, Pixel) ou entalhes de tela.
- **A solução:** Considerar `(StatusBar.currentHeight || 40) + respiro_dinamico` ou a SafeArea nativa do dispositivo.

---

## 3. Diretrizes de Engenharia e Design de Alto Nível (O que FAZER)

### 💎 Botões com Resposta Tátil
- Botões primários devem ter presença: gradientes ricos, contraste rigoroso, borda de iluminação sutil (1px superior) e micro-escala ao toque (`scale: 0.98` via `Animated` ou `Pressable`).
- Estado desabilitado deve ser refinado, nunca uma mancha cinza ilegível.

### 💎 Tipografia e Espaçamento
- Use proporções matemáticas e espaçamentos múltiplos de 4/8px.
- Evite fontes de sistema desinteressantes sem alinhamento visual.
- Garanta contraste mínimo WCAG AA para qualquer texto secundário ou dica de formulário.

### 💎 Copywriting Humano e Elegante
- Redija textos como um ser humano profissional escrevendo para outro.
- Seja conciso: *"Já tenho uma conta"*, *"Esqueceu a senha?"*, *"Como obter acesso"*.
- Nunca use textos burocráticos ou jargões de assistente virtual.

### 💎 Performance de 60/120 FPS
- No React Native, use `useNativeDriver: true` para todas as transformações de opacidade e translação.
- Garanta que animações ambientais não acionem re-renderizações desnecessárias na árvore de componentes.
