# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Prestador de serviço autônomo — profissional que trabalha sozinho (não um vendedor) e precisa organizar clientes, agenda, próximos atendimentos, orçamentos, retornos e histórico de relacionamento. Pequenas equipes (2-5 pessoas) podem ser atendidas futuramente, mas o foco inicial é o microempreendedor individual.

## Product Purpose

Orbis é um CRM simples e rápido para microempreendedores e prestadores de serviço. Responde no dia a dia a perguntas como: quem atender hoje, quem cobrar, quem pediu orçamento, quem retornar, quem gera dinheiro, o que está atrasado. Sucesso é o usuário abrir o app e saber imediatamente o que fazer no dia, sem precisar interpretar telas complexas.

## Positioning

Velocidade e simplicidade frente a CRMs corporativos tradicionais (Pipedrive, RD Station) e frente a planilhas/agenda de papel. O Orbis não compete em quantidade de recursos empresariais — compete em não exigir que o usuário aprenda a operar um CRM. Deve parecer um assistente de organização do negócio, não um CRM corporativo.

## Operating Context

Rotina diária de atendimento: consulta de clientes, agenda de compromissos (com categoria, status, conclusão, reagendamento), retorno via WhatsApp (deep link), acompanhamento de orçamentos e histórico por cliente. "Meu Dia" é a tela central que concentra próximo compromisso, pendências, atrasados e ações rápidas.

## Capabilities and Constraints

Stack: backend Java 21/Spring Boot/Spring Security/JWT/JPA/Hibernate/Flyway/MySQL; frontend React/TypeScript/Vite/TailwindCSS/Radix UI/Lucide Icons. Autenticação via JWT (token em localStorage), rate limiting de login por IP e e-mail. Funcionalidades hoje: Login, Cadastro, Clientes (CRUD), Agenda (CRUD com categoria/status), Meu Dia (dashboard). Financeiro e Orçamentos ainda não existem como módulos (backend já responde `ModuloStatus.disponivel = false` para eles). Em aberto: fluxo de recuperação de senha e confirmação de senha no cadastro não existem ainda — decisão de escopo pendente para quando entrarem em implementação.

## Brand Commitments

Manter: nome "Orbis"; o conceito de anel/logo (componente `OrbisLogo`, anel gradiente ciano→azul com "costuras" de giro); a cor de identidade principal `orbis-blue`; a sensação de produto premium, simples e confiável. O restante da linguagem visual é aberto para exploração, buscando inspiração em SaaS como Linear, Notion e Vercel, transmitindo simplicidade, organização, confiança, profissionalismo e tecnologia acessível para microempreendedores.

**Direção visual pinada para telas de autenticação (aprovada pelo usuário em 2026-07-31):** cartão de vidro flutuante (`backdrop-filter: blur`, fundo translúcido escuro, borda 1px sutil) centralizado sobre fundo quase preto com glow radial azul (`orbis-blue`) subindo da base, mais um halo secundário mais frio no canto oposto. Logo `OrbisLogo` com `drop-shadow` luminoso, centralizada. Campos e botão em formato pílula (`border-radius: 999px`), ícones à esquerda (mail/lock) e toggle de mostrar senha à direita. Abas "Entrar/Criar conta" como segmented control translúcido. Título "Bem-vindo ao Orbis" (centralizado) com subtítulo menor, também centralizado: "Tenha controle do seu negócio sem complicação. Acompanhe clientes, compromissos e tarefas do seu dia." Esta é a referência definitiva para Login/Cadastro — qualquer nova exploração visual para essas telas deve partir daqui, não recomeçar do zero.

## Evidence on Hand

Nenhum testemunho, case ou dado de cliente real disponível ainda — produto em desenvolvimento inicial. Design System de componentes já existe e está documentado no código (`frontend/src/styles.css`, `frontend/src/components/ui/*`): tokens OKLCH de cor (light/dark), radius, sombra, tipografia, espaçamento, animação; componentes Button, Card, Input, Textarea, Label, Dialog, Popover, Badge, StatCard, Toaster.

## Product Principles

- Priorizar o que precisa ser feito hoje sobre listagens genéricas — a interface deve responder "o que eu faço agora", não só exibir dados.
- Nunca introduzir complexidade de CRM corporativo (funis de vendas elaborados, relatórios densos) sem necessidade comprovada do usuário-alvo.
- WhatsApp e contato direto com o cliente são parte do fluxo central, não um recurso periférico.
- Consistência visual via Design System único — nenhuma tela isolada com estilo próprio.
- Produto deve parecer confiável e premium mesmo sendo simples — simplicidade não é sinônimo de aparência amadora.

## Accessibility & Inclusion

Nenhum requisito específico de acessibilidade foi estabelecido além de boas práticas padrão (contraste, foco visível, uso de labels em formulários), já presentes no Design System atual.
