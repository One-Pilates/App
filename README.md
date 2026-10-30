# One Pilates — App Mobile

Aplicativo móvel do estúdio One Pilates, oferecendo uma interface moderna e intuitiva para os usuários acompanharem seus agendamentos e informações do estúdio diretamente pelo celular.

<p align="center">
  <img src="https://skillicons.dev/icons?i=react,ts" alt="Tecnologias principais" />
</p>

## Stack
- React Native
- Expo
- TypeScript
- React Navigation
- Axios
- AsyncStorage

## Funcionalidades
- Autenticação e controle de acesso
- Visualização da tela inicial
- Integração com a API do sistema One Pilates
- Gerenciamento de sessão de usuário (Context API)
- Navegação fluida entre telas

## Requisitos
- Node.js 18+
- npm 9+
- Aplicativo Expo Go (no celular) ou Emulador Android/iOS

## Como rodar localmente
```bash
# instalar dependências
npm install

# iniciar o servidor de desenvolvimento do Expo
npx expo start
```

O endereço da API é lido do arquivo `.env` por `EXPO_PUBLIC_API_URL`. Depois de
criar ou alterar essa variável, encerre o processo do Expo e reinicie limpando o
cache para que o valor entre no bundle web:

```bash
npx expo start --web --clear
```

As requisições da API e os resultados dos dashboards aparecem no console do
navegador com os prefixos `[API]`, `[DASHBOARD][PROFESSOR]` e
`[DASHBOARD][SECRETARIA]`. O token não é impresso nos logs.

Após iniciar, escaneie o QR Code gerado no terminal usando o aplicativo **Expo Go** (no Android) ou o app da **Câmera** (no iOS) no seu celular.

## Scripts
```bash
# iniciar em ambiente de desenvolvimento
npm start

# iniciar forçando a abertura do emulador Android
npm run android

# iniciar forçando a abertura do simulador iOS
npm run ios

# iniciar na versão web
npm run web
```

## Estrutura principal
```text
src/
  contexts/
    AuthContext.tsx
  routes/
    index.tsx
  screens/
    Home/
      HomeScreen.tsx
    Login/
      LoginScreen.tsx
  services/
    api.ts
assets/
  logoBranca.png
  logoMinimalistaBranca.png
  logoMinimalistaPreta.png
  logoOriginal.png
  logoPreta.png
```
