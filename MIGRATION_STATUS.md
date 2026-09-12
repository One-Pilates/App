# Status da Migração Web → Mobile (One Pilates)

> Documento de acompanhamento da migração do app web (React + Vite) para o mobile (Expo + expo-router).
> Última atualização: 2026-09-12.

Legenda:
- ✅ **Migrado e funcional** (integrado ao backend real)
- 🟡 **Parcial / mockado** (UI pronta, mas com dados fixos ou faltando peças)
- ❌ **Stub** (placeholder, ainda não migrado)
- ➖ **Não migrado** (funcionalidade transversal ou página que ainda não existe no mobile)

---

## 1. Autenticação (`(public)`)

| Tela | Status | Observações |
|---|:---:|---|
| Login | ✅ | `POST /auth/login`, token no AsyncStorage, redirect por role |
| Esqueci a senha | ✅ | `POST auth/criarCodigoVerificacao` |
| Código de verificação | ✅ | `POST auth/validarCodigo` + reenvio |
| Nova senha | ✅ | `POST auth/alterarSenha` com validação de regras |
| Redefinir senha | ❌ | Stub (`redefinir-senha.tsx`) — migrar de `components/Password.jsx` |
| Termos de uso | ➖ | Página estática do web ainda não migrada |
| Política de privacidade | ➖ | Página estática do web ainda não migrada |

**Pendência de fluxo:** o `primeiroAcesso` (redirecionar para definir senha no 1º login) existe no web mas **ainda não** foi implementado no `AuthContext` do mobile.

---

## 2. Secretaria / Administrador (`(secretary)`)

| Tela | Status | Observações |
|---|:---:|---|
| Dashboard (Início) | 🟡 | KPIs e gráfico com **dados mockados** — falta integrar endpoints reais |
| Agenda | 🟡 | Calendário + lista de aulas **mockados** — falta integrar |
| Perfil | ✅ | Edição completa (foto, endereço, ViaCEP, especialidades), `PATCH` por role |
| Alunos (listagem) | ✅ | `GET api/alunos/paginacao`, busca, filtro status, excluir |
| Aluno — visualização (perfilView) | ✅ | Somente leitura, busca por `tipo`/`id` |
| Aluno — cadastrar | ❌ | Stub — migrar de `RegisterStudent` |
| Aluno — editar | ❌ | Stub — migrar de `RegisterStudent` (modo edição) |
| Colaboradores (hub) | ✅ | Cards Professores / Secretárias |
| Professores (listagem) | ✅ | Paginação server-side (scroll infinito), busca, ativar/desativar, excluir (admin) |
| Secretárias (listagem) | ✅ | Lista completa, busca client-side, ativar/desativar, excluir (admin) |
| Colaborador — cadastrar | ❌ | Stub — migrar de `RegisterCollaborator` |
| Studio | ✅ | Especialidades + Salas (CRUD completo), admin-only |
| Agendamento (index) | 🟡 | Reaproveita a agenda (mockada) |
| Agendamento — criar aula | ❌ | Stub — migrar de `RegisterAula` |
| Mais (hub de navegação) | ✅ | Colaboradores, Studio (admin), Perfil, Sair |

---

## 3. Professor (`(teacher)`)

| Tela | Status | Observações |
|---|:---:|---|
| Dashboard | 🟡 | Mockado (idêntico ao da secretaria) |
| Agenda | 🟡 | Mockado |
| Perfil | ✅ | Mesmo componente compartilhado (`ProfileScreen`) |

---

## 4. Funcionalidades transversais (web → mobile)

| Recurso | Status | Observações |
|---|:---:|---|
| Autenticação + interceptors (token) | ✅ | `api.ts` com request/response interceptors |
| Redirect por role | ✅ | `PROFESSOR` → teacher; `SECRETARIA`/`ADMIN` → secretary |
| Feedback ao usuário | 🟡 | Helper `notify` usando `Alert` nativo (trocável por lib de toast depois) |
| Modo privacidade (mascarar dados) | ➖ | Existe no web (PrivacyContext), não migrado |
| Logout por inatividade (15 min) | ➖ | Existe no web (InactivityTracker), não migrado |
| Exportar PDF / Excel | ➖ | Existe no web (jsPDF, XLSX), não migrado |
| Upload de foto | ✅ | `expo-image-picker` (perfil) |
| Máscaras / validações | ✅ | `utils.ts` (telefone, CEP, e-mail, especialidades) |

---

## 5. Prioridade sugerida para os próximos passos

1. **Cadastro de aluno** (`aluno/cadastrar`) — fecha o CRUD de alunos (criar + editar).
2. **Editar aluno** (`aluno/editar/[id]`) — reaproveita o formulário do cadastro.
3. **Cadastro de colaborador** (`colaborador/cadastrar/[role]`) — habilita o botão "+" já existente nas listas.
4. **Integrar Agenda** com dados reais — desbloqueia "Ver agenda" e o fluxo de agendamento.
5. **Criar aula** (`agendamento/criar`) — depende da agenda integrada.
6. **Integrar Dashboard** com KPIs reais.
7. **Redefinir senha** + fluxo de `primeiroAcesso`.
8. Recursos transversais opcionais: modo privacidade, logout por inatividade, exportação.

---

## Resumo rápido

- **Migrado e funcional:** todo o fluxo de autenticação (exceto redefinir/primeiro acesso), Perfil, Alunos (lista + visualização), Colaboradores (hub, professores, secretárias), Studio, navegação por tabs + hub "Mais".
- **Falta integrar (mock):** Dashboard e Agenda (secretaria e professor).
- **Falta migrar (stub):** cadastros (aluno, colaborador, aula), edição de aluno, redefinir senha.
- **Não migrado (transversal):** modo privacidade, inatividade, exportação, páginas estáticas (termos/política).
