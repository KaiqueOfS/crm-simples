# Auditoria de Prontidão para Produção — Orbis CRM

Auditoria final, na perspectiva de um Staff Engineer decidindo se este SaaS pode receber usuários reais agora. Cobre CI/CD, observabilidade, logs, LGPD, segurança, performance, banco de dados, frontend, UX, arquitetura e deploy. Nenhum arquivo foi alterado — isto é só o relatório.

Este documento assume o estado **atual do working tree** (não apenas o que já foi commitado — ver P0.1, que é justamente sobre essa distinção).

---

## Veredito

**Não.** O backend evoluiu de forma consistente e hoje tem fundamentos sólidos (Flyway, DTOs, isolamento testado, rate limiting, JWT testado). Mas o projeto como um todo não está pronto para receber usuários reais, por um motivo que não é código: **não existe processo de entrega**. Não há commit do trabalho recente, não há CI, não há pipeline de deploy, não há Dockerfile, não há observabilidade em produção, e não existe base legal mínima (LGPD) para armazenar dado de terceiros (os clientes dos seus clientes). Nenhum desses pontos é sobre "o código não funciona" — é sobre "não existe forma segura e repetível de colocar isso no ar, nem de operar depois que estiver".

A lista de P0 abaixo é o caminho crítico mínimo antes do primeiro usuário pagante. Nenhum item de P0 exige reescrever arquitetura — são lacunas de processo e de conformidade, não de engenharia de domínio.

---

## P0 — Bloqueia lançamento

### P0.1 — Meses de trabalho não estão commitados
**Categoria:** CI/CD, deploy, arquitetura de processo
**Problema:** `git status` mostra dezenas de arquivos alterados/novos no working tree — incluindo toda a migração para Flyway, a camada de DTOs, os timestamps de auditoria, o rate limiting, e a correção de contraste/dark mode do frontend. O último commit é anterior a tudo isso. Não existe branch, não existe PR, não existe histórico de nenhuma dessas mudanças.
**Impacto:** Se a máquina/ambiente local for perdido, corrompido, ou simplesmente trocado, todo esse trabalho desaparece. Mais grave para "lançamento": não existe um commit correspondente ao estado que foi testado — qualquer deploy hoje seria "copiar arquivos da minha máquina", não um processo reproduzível.
**Solução recomendada:** Commitar em um ou mais commits coerentes (ex.: por tema — Flyway, DTOs, auditoria, rate limiting, frontend), abrir PR, revisar, mergear. Isso é pré-requisito literal para qualquer um dos outros itens de P0 (não dá para ter CI sem commit, nem pipeline de deploy sem branch).
**Prioridade:** P0

### P0.2 — Nenhum pipeline de CI
**Categoria:** CI/CD
**Problema:** Não existe `.github/workflows` (nem qualquer outro pipeline) rodando `mvn test`, `npm run build` ou `tsc --noEmit` a cada push/PR.
**Impacto:** Nada impede um commit quebrado de chegar à branch principal. A qualidade depende inteiramente de alguém lembrar de rodar os testes manualmente. Isso já se provou um risco real: o bug do `asChild` em `Landing.tsx` (ver P0.5) está no código há várias sessões porque `tsc --noEmit` nunca roda automaticamente.
**Solução recomendada:** GitHub Actions com dois jobs mínimos: (1) backend — `./mvnw test`; (2) frontend — `npm run build` + `npm exec tsc -- --noEmit`. Rodar em todo push e PR contra a branch principal.
**Prioridade:** P0

### P0.3 — Sem processo de deploy definido (sem Dockerfile, sem infraestrutura documentada)
**Categoria:** Deploy
**Problema:** Não existe `Dockerfile`, `docker-compose.yml`, nem documentação de como e onde a aplicação roda em produção (qual provedor, como o MySQL é provisionado, como os segredos — `JWT_SECRET`, `DB_PASSWORD` — chegam ao ambiente de produção sem passar por `.env` versionado).
**Impacto:** "Fazer deploy" hoje não é um processo, é uma decisão ad-hoc a ser tomada na hora. Isso é o tipo de lacuna que vira incidente na primeira tentativa real de subir o sistema (esquecer uma variável de ambiente, versão de Java incompatível no servidor, etc.).
**Solução recomendada:** Um `Dockerfile` multi-stage (build do frontend → build do backend com o frontend embutido em `static/` → imagem final só com o JRE), documentação mínima de quais variáveis de ambiente são obrigatórias em produção (`JWT_SECRET`, `DB_PASSWORD`, `ALLOWED_ORIGINS`), e onde/como isso é provisionado (mesmo que a resposta inicial seja "um único servidor com Docker Compose").
**Prioridade:** P0

### P0.4 — Nenhuma base legal/funcional para LGPD
**Categoria:** LGPD
**Problema:** O cadastro (`POST /api/usuarios`) não apresenta termos de uso, política de privacidade, nem captura consentimento explícito. Não existe endpoint ou fluxo para um titular de dado (o usuário da conta, ou — mais sensível — a pessoa cujo contato está cadastrado como `Cliente`) solicitar exportação ou exclusão dos próprios dados. Não existe política de retenção documentada.
**Impacto:** Orbis armazena dado pessoal de terceiros (nome, telefone, e-mail de clientes de outras empresas) por definição — é um CRM. Operar isso comercialmente no Brasil sem base legal mínima (consentimento/termos no cadastro, mecanismo de exclusão) é exposição legal direta sob a LGPD desde o primeiro usuário pago, não uma preocupação "de escala".
**Solução recomendada:** (a) Tela de cadastro passa a exigir aceite explícito de termos de uso/política de privacidade (checkbox, não pré-marcado); (b) escrever e publicar a política de privacidade; (c) endpoint/fluxo de exclusão de conta que apague (ou anonimize) os dados do usuário e dos clientes associados; (d) documentar por quanto tempo o dado é retido após o encerramento de uma conta.
**Prioridade:** P0

### P0.5 — Erro de tipo conhecido em produção (`Landing.tsx`)
**Categoria:** Frontend
**Problema:** `Button` (`components/ui/button.tsx`) não suporta a prop `asChild`, mas `Landing.tsx:28` a usa. `tsc --noEmit` falha nisso desde antes da refatoração de design system — já havia sido sinalizado como item separado nesta mesma sessão de trabalho e continua sem correção.
**Impacto:** `npm run build` (via esbuild/Vite) não tipa, então isso não impede o build hoje — mas é a prova viva de que nenhum type-check roda no fluxo de trabalho atual (reforça P0.2). Também é um bug de comportamento real: a prop é ignorada silenciosamente, então o botão da landing page provavelmente não renderiza como pretendido (deveria virar um link, e hoje é só um `<button>` com um atributo HTML inválido `aschild`).
**Solução recomendada:** Implementar suporte a `asChild` no `Button` (via `@radix-ui/react-slot`, já instalado) ou remover o uso em `Landing.tsx`. Já existe uma sugestão de tarefa aberta para isso.
**Prioridade:** P0 (baixo esforço, mas é o único bug funcional conhecido e não corrigido em uma tela pública)

### P0.6 — CORS default aponta para localhost
**Categoria:** Segurança / Deploy
**Problema:** `app.cors.allowed-origins=${ALLOWED_ORIGINS:http://localhost:5173,http://localhost:5174}` — se a variável de ambiente `ALLOWED_ORIGINS` não for definida no ambiente de produção, a API só aceita requisições de origens de desenvolvimento local.
**Impacto:** Cenário mais provável: alguém esquece de setar a variável em produção, o frontend real fica bloqueado por CORS, e isso só é descoberto depois do deploy (indisponibilidade total do app para o usuário final, sintoma confuso). Não é uma falha de segurança em si (o default é restritivo, não permissivo), mas é um modo de falha silencioso e totalmente evitável.
**Solução recomendada:** Sem default em produção — falhar o boot da aplicação se `ALLOWED_ORIGINS` não estiver definida (mesmo padrão de fail-fast já usado em `JwtService` para `JWT_SECRET` ausente/curto), ou documentar explicitamente e verificar via checklist de deploy.
**Prioridade:** P0

---

## P1 — Importante antes do lançamento

### P1.1 — Zero observabilidade em produção
**Categoria:** Observabilidade
**Problema:** Sem `spring-boot-starter-actuator`, sem `/actuator/health`, sem métricas (Micrometer/Prometheus), sem tracing distribuído, sem correlation ID por requisição nos logs.
**Impacto:** Em produção, não há como saber se a aplicação está saudável sem depender de sintoma externo (usuário reclamando). Um erro 500 intermitente não tem como ser correlacionado entre múltiplas linhas de log da mesma requisição.
**Solução recomendada:** Adicionar Actuator com `/actuator/health` exposto (para health-check de infraestrutura/load balancer), e um filtro de correlation-id via MDC nos logs.
**Prioridade:** P1

### P1.2 — Logs sem estrutura e com PII (e-mail) em texto plano
**Categoria:** Logs / LGPD
**Problema:** `ClienteService`, `AgendamentoService` e `DashboardService` logam `usuario.getEmail()` diretamente (`log.info("Cliente criado: id={} usuario={}", ..., usuario.getEmail())`). Não há logging estruturado (JSON), nem política de retenção/rotação de log documentada.
**Impacto:** E-mail é dado pessoal; logar em texto plano sem necessidade (o `id` já identifica o usuário de forma equivalente para fins de depuração) aumenta a superfície de exposição de PII — qualquer pessoa com acesso aos logs (incluindo um serviço de agregação de logs terceirizado) vê e-mails de usuários.
**Solução recomendada:** Trocar `usuario.getEmail()` por `usuario.getId()` nesses logs. Adotar logging estruturado (JSON) se/quando um agregador de log for adotado.
**Prioridade:** P1

### P1.3 — Sem trava de concorrência otimista
**Categoria:** Banco de dados / Arquitetura
**Problema:** `Cliente` e `Agendamento` não têm campo `@Version`.
**Impacto:** Duas edições simultâneas do mesmo registro (duas abas do mesmo usuário, ou futuramente dois membros de uma equipe) resultam em last-write-wins silencioso, sem detecção de conflito.
**Solução recomendada:** Adicionar `@Version private Long versao;` + migration Flyway correspondente.
**Prioridade:** P1

### P1.4 — Sem índices compostos para os padrões de consulta reais
**Categoria:** Performance / Banco de dados
**Problema:** As queries mais usadas (`findByUsuarioAndStatus`, `findByUsuarioAndDataBetweenOrderByDataAscHoraAsc`) filtram por `usuario_id` + uma segunda coluna, mas não há índice composto declarado — só a FK implícita.
**Impacto:** Não é problema hoje (volume baixo), mas degrada de forma invisível conforme a base de clientes cresce por conta.
**Solução recomendada:** Migration nova com índices compostos `(usuario_id, status)` em `clientes` e `(usuario_id, data)` em `agendamentos`.
**Prioridade:** P1

### P1.5 — `GET /api/agendamentos` sem paginação
**Categoria:** Performance
**Problema:** Ao contrário de `/api/clientes` (que já pagina via `PaginaResponse`), a listagem de agendamentos sempre retorna a lista inteira do usuário.
**Impacto:** Funciona bem na escala atual (agenda pessoal); se o volume de agendamentos por usuário crescer (histórico de anos, por exemplo), a resposta cresce sem limite.
**Solução recomendada:** Aplicar o mesmo padrão de paginação já usado em `Cliente`, quando o volume justificar — não é urgente hoje, mas deve entrar no radar antes que vire dor real.
**Prioridade:** P1 (baixo, mas junte com P1.4 na mesma leva de trabalho de performance)

### P1.6 — Zero teste automatizado de frontend
**Categoria:** Frontend / CI-CD
**Problema:** Não há Vitest, Jest, Testing Library, nem Playwright/Cypress no projeto. Toda a validação de UI (incluindo a extensa refatoração de design system feita recentemente) foi manual, via browser.
**Impacto:** Qualquer regressão futura em componente compartilhado (`Button`, `Input`, `Dialog`) só é percebida visualmente, se alguém abrir a tela certa. Não escala para um time maior que uma pessoa.
**Solução recomendada:** No mínimo, Vitest + Testing Library cobrindo os componentes de `components/ui` (Button, Input, Textarea, Card, Dialog) e o fluxo de login. Não precisa ser abrangente no dia 1 — precisa existir.
**Prioridade:** P1

### P1.7 — Sem verificação de e-mail no cadastro
**Categoria:** Segurança / LGPD
**Problema:** Qualquer e-mail pode ser usado no cadastro sem confirmação de posse.
**Impacto:** Alguém pode criar uma conta usando o e-mail de outra pessoa (sem conseguir de fato acessá-la depois, mas ainda assim gera ruído/lixo de dado, e é uma prática esperada de qualquer SaaS sério).
**Solução recomendada:** Fluxo de confirmação por e-mail antes de liberar login pleno (ou pelo menos antes de permitir ações sensíveis).
**Prioridade:** P1

### P1.8 — Sem processo de recuperação de senha
**Categoria:** UX / Segurança
**Problema:** Não existe fluxo de "esqueci minha senha" — nem endpoint no backend, nem tela no frontend.
**Impacto:** Um usuário real que esquece a senha fica sem acesso à própria conta, sem alternativa além de contatar suporte manualmente (se existir suporte). Para um SaaS, isso é uma lacuna de UX crítica na jornada básica de autenticação, não uma funcionalidade "extra".
**Solução recomendada:** Fluxo padrão de reset por e-mail com token de expiração curta.
**Prioridade:** P1

### P1.9 — Sem rate limiting fora do login
**Categoria:** Segurança
**Problema:** O rate limiting implementado recentemente cobre só `POST /api/auth/login`. Os outros endpoints autenticados (`/api/clientes`, `/api/agendamentos`) não têm nenhum limite de taxa.
**Impacto:** Um token válido comprometido (ou um usuário legítimo com um script com bug) pode gerar volume alto de requisições sem nenhuma contenção.
**Solução recomendada:** Rate limiting genérico por usuário autenticado (não só no login), reaproveitando a mesma infraestrutura Bucket4j já adotada.
**Prioridade:** P1

### P1.10 — `Usuario` fora do rastreamento de auditoria
**Categoria:** LGPD / Banco de dados
**Problema:** `Cliente` e `Agendamento` ganharam `createdAt`/`updatedAt` recentemente; `Usuario` não.
**Impacto:** Não há como saber quando uma conta foi criada ou quando o perfil foi alterado pela última vez — relevante tanto para operação quanto para responder a uma eventual solicitação de dados sob LGPD ("quando esta conta foi criada").
**Solução recomendada:** Mesmo padrão (`@CreationTimestamp`/`@UpdateTimestamp` + migration `V3`).
**Prioridade:** P1

---

## P2 — Melhoria futura

### P2.1 — Exceção genérica fora do padrão (`UsuarioService`)
`UsuarioService.atualizarPerfil` lança `new RuntimeException(...)` solta em vez de uma exceção customizada como o resto do código. Baixo risco, mas quebra a consistência arquitetural. **Prioridade: P2**

### P2.2 — Handler de `RuntimeException` genérico demais
O handler catch-all de `RuntimeException` no `GlobalExceptionHandler` devolve `getMessage()` ao cliente para qualquer `RuntimeException` não mapeada — seguro hoje, mas um mecanismo amplo o suficiente para vazar mensagem inesperada no futuro. **Prioridade: P2**

### P2.3 — Sem soft delete
`deletar()` em `Cliente`/`Agendamento` é `DELETE` físico — sem trilha do que foi removido. Combinado com backup/retenção documentados, pode ser aceitável; sem isso, exclusão acidental é irreversível. **Prioridade: P2**

### P2.4 — Configuração de banco com valores hardcoded
`spring.datasource.username=root` está fixo no `application.properties` versionado — só a senha vem de variável de ambiente. **Prioridade: P2**

### P2.5 — Sem perfis de ambiente (`application-{profile}.properties`)
Uma única `application.properties` cobre tudo; funciona hoje via variável de ambiente, mas não escala limpamente para múltiplos ambientes reais (staging, produção). **Prioridade: P2**

### P2.6 — Sem histórico de transição de status do funil
`updatedAt` muda com qualquer edição do cliente, não só mudança de etapa — não há como reconstruir "quanto tempo esse lead ficou em cada etapa" sem uma tabela de histórico dedicada. Feature nova, não um bug. **Prioridade: P2**

### P2.7 — Sem CDN/cache de assets estáticos do frontend
O frontend é servido diretamente pelo Spring Boot a partir de `static/`, sem CDN, sem cache-control agressivo documentado para os assets com hash no nome. Não é urgente na escala atual. **Prioridade: P2**

### P2.8 — Sem paywall/billing
Não há integração de cobrança (Stripe ou equivalente) nem diferenciação de planos — irrelevante para "pronto para receber usuários reais" no sentido técnico, mas relevante para "pronto para virar negócio". Fora do escopo desta auditoria técnica, registrado para visibilidade. **Prioridade: P2**

---

## Resumo por categoria

| Categoria | P0 | P1 | P2 |
|---|---|---|---|
| CI/CD | 2 | 1 | — |
| Deploy | 2 (compartilhado com CI/CD) | — | — |
| LGPD | 1 | 3 (compartilhados) | — |
| Segurança | 1 (compartilhado) | 3 | — |
| Observabilidade | — | 1 | — |
| Logs | — | 1 (compartilhado) | — |
| Performance | — | 2 | 1 |
| Banco de dados | — | 3 (compartilhados) | 2 |
| Frontend | 1 | 1 | 1 |
| UX | — | 1 (compartilhado) | — |
| Arquitetura | — | 1 (compartilhado) | 3 |

**Total: 6 P0, 10 P1, 8 P2.**

## O que NÃO está na lista de bloqueios — e por que isso importa

Vale registrar explicitamente o que já está resolvido, porque é fácil uma auditoria final parecer só uma lista de problemas: isolamento de dado entre usuários está testado (service + integração fim a fim); schema de banco é versionado (Flyway) em vez de `ddl-auto=update`; a API não expõe mais entidade JPA diretamente (DTOs); JWT tem cobertura de teste real (token adulterado, expirado, chave errada); força bruta no login tem rate limiting testado por IP e por e-mail. Isso é trabalho de fundação real e já feito — o que falta agora é, majoritariamente, **processo** (commit, CI, deploy, observabilidade) e **conformidade** (LGPD), não mais engenharia de domínio.

## Recomendação de sequenciamento

1. Commitar tudo (P0.1) — sem isso, nada mais abaixo tem base para acontecer.
2. CI mínimo (P0.2) — protege o que vem depois.
3. LGPD mínima (P0.4) + CORS fail-fast (P0.6) — antes de qualquer usuário real tocar o sistema.
4. Dockerfile + processo de deploy (P0.3) — só faz sentido depois de 1–3.
5. Corrigir `Landing.tsx` (P0.5) — isolado, baixo esforço, faça em paralelo a qualquer momento.
6. P1 em ordem de risco: recuperação de senha (P1.8) e verificação de e-mail (P1.7) antes de abrir cadastro público; observabilidade (P1.1) antes do primeiro dia em produção, não depois do primeiro incidente.
