# Status da Migração Web → Mobile (One Pilates)

> Documento de acompanhamento da migração do app web (React + Vite) para o mobile (Expo + expo-router).

> Última atualização: 2026-09-28.

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

| Nova senha | ✅ | `POST auth/alterarSenha` com validação de regras (+ modo primeiro acesso) |

| Redefinir senha | ✅ | Tela de 3 etapas (Email → Código → Nova Senha) p/ usuário logado; entrada no Perfil |

| Termos de uso | ➖ | Página estática do web ainda não migrada |

| Política de privacidade | ➖ | Página estática do web ainda não migrada |

**Fluxo de `primeiroAcesso`:** ✅ implementado — após o login, se `primeiroAcesso`, o usuário é levado a definir a senha (`nova-senha` em modo primeiro acesso) antes de acessar o app; guardas em `index.tsx` e `(public)/_layout.tsx`.

---

## 2. Secretaria / Administrador (`(secretary)`)

| Tela | Status | Observações |

|---|:---:|---|

| Dashboard (Início) | ✅ | KPIs e gráficos integrados aos endpoints reais; atualização ao retornar para a aba e ao puxar para atualizar |

| Agenda | 🟡 | Calendário + lista de aulas **mockados** — falta integrar |

| Perfil | ✅ | Edição completa (foto, endereço, ViaCEP, especialidades), `PATCH` por role |

| Alunos (listagem) | ✅ | `GET api/alunos/paginacao`, busca, filtro status, excluir |

| Aluno — visualização (perfilView) | ✅ | Somente leitura, busca por `tipo`/`id` |

| Aluno — cadastrar | ✅ | `POST api/alunos` — form 4 etapas (`StudentForm`), ViaCEP, máscaras, validações |

| Aluno — editar | ✅ | `GET`/`PATCH api/alunos/{id}` — reaproveita `StudentForm` (modo edição) |

| Colaboradores (hub) | ✅ | Cards Professores / Secretárias |

| Professores (listagem) | ✅ | Paginação server-side (scroll infinito), busca, ativar/desativar, excluir (admin) |

| Secretárias (listagem) | ✅ | Lista completa, busca client-side, ativar/desativar, excluir (admin) |

| Colaborador — cadastrar | ✅ | `POST api/professores`/`api/secretarias` — `CollaboratorForm` (foto, especialidades, senha gerada) |

| Studio | ✅ | Especialidades + Salas (CRUD completo), admin-only |

| Agendamento (index) | 🟡 | Reaproveita a agenda (mockada) |

| Agendamento — criar aula | ❌ | Stub — migrar de `RegisterAula` |

| Mais (hub de navegação) | ✅ | Colaboradores, Studio (admin), Perfil, Sair |

---

## 3. Professor (`(teacher)`)

| Tela | Status | Observações |

|---|:---:|---|

| Dashboard | ✅ | KPIs e gráfico integrados ao endpoint real; atualização ao retornar para a aba e ao puxar para atualizar |

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

1. **Integrar Agenda** com dados reais (Calendar) — desbloqueia "Ver agenda" e o fluxo de agendamento.

2. **Criar aula** (`agendamento/criar`) — migrar de `RegisterAula`; depende da agenda integrada.

3. ~~**Integrar Dashboard** com KPIs reais (secretaria e professor).~~ ✅ Concluído.

4. Recursos transversais opcionais: modo privacidade, logout por inatividade, exportação (PDF/Excel), páginas estáticas (termos/política).

> Concluídos recentemente: cadastro/edição de aluno, cadastro de colaborador, redefinir senha + primeiro acesso. Corrigido também o bug de fuso na seleção de datas (perfil e formulários) e a API depreciada do `DateTimePicker`.

---

## Resumo rápido

- **Migrado e funcional:** todo o fluxo de autenticação (incluindo redefinir senha e primeiro acesso), Perfil, Alunos (lista + visualização + **cadastro/edição**), Colaboradores (hub, professores, secretárias + **cadastro**), Studio, navegação por tabs + hub "Mais".

- **Falta integrar (mock):** Agenda (secretaria e professor).

- **Falta migrar (stub):** criar aula (`agendamento/criar`).

- **Não migrado (transversal):** modo privacidade, inatividade, exportação, páginas estáticas (termos/política).
