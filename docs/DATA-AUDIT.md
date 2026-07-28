# Auditoria de dados — created_at / updated_at

## Problema anterior

`Cliente` e `Agendamento` não guardavam nenhuma informação de quando um registro foi criado ou pela última vez alterado. Isso já tinha sido registrado como débito técnico tanto em `docs/FLYWAY.md` quanto em `docs/DTO-ARCHITECTURE.md`: sem essas colunas, não existe como responder perguntas básicas de operação e produto — "quantos clientes entraram este mês?", "esse lead está parado há quanto tempo nessa etapa?", "quando foi o último contato registrado?" — nem oferecer qualquer relatório histórico. Também não havia como uma investigação de suporte ("por que esse cliente sumiu da lista?") reconstruir a linha do tempo de um registro.

## Solução implementada

Duas colunas novas, `created_at` e `updated_at`, em `clientes` e `agendamentos`, preenchidas automaticamente pelo Hibernate via as anotações padrão do JPA/Hibernate `@CreationTimestamp` e `@UpdateTimestamp` — sem nenhuma lógica manual de "setar a data agora" espalhada pelos services.

```java
@CreationTimestamp
@Column(name = "created_at", nullable = false, updatable = false)
private LocalDateTime createdAt;

@UpdateTimestamp
@Column(name = "updated_at", nullable = false)
private LocalDateTime updatedAt;
```

Pontos importantes dessa escolha:

- **Sem setter público.** Só existe `getCreatedAt()`/`getUpdatedAt()`. Isso não é omissão — é a garantia de que nenhum código de aplicação (nem por engano, nem no futuro) consiga forjar essas datas. Quem escreve o valor é sempre o Hibernate, no momento exato do INSERT/UPDATE.
- **`updatable = false` em `createdAt`.** Mesmo que alguém tentasse, o Hibernate nunca inclui essa coluna em um `UPDATE` — o valor de criação é imutável depois de gravado.
- **Nada nos `Request` DTOs.** `ClienteRequest` e `AgendamentoRequest` (ver `docs/DTO-ARCHITECTURE.md`) não têm `createdAt`/`updatedAt`. O frontend nunca precisa (e nunca deveria) enviar essas datas — elas simplesmente não existem do lado de quem escreve.
- **Presentes em `ClienteResponse`/`AgendamentoResponse`.** Todo GET/POST/PUT desses recursos passa a devolver os dois campos, prontos para a UI exibir ("criado há 3 dias", "última atualização hoje às 14h32", etc.) sem exigir nenhuma chamada extra.

## Como os timestamps funcionam, na prática

O Hibernate gerencia isso em dois pontos do ciclo de vida da entidade, dentro do próprio `EntityManager` — não depende de trigger de banco nem de código escrito à mão:

- **`@PrePersist`** (disparado por `@CreationTimestamp`): roda uma única vez, exatamente antes do `INSERT`, e preenche `createdAt` com o instante atual.
- **`@PreUpdate`** (disparado por `@UpdateTimestamp`): roda antes de **todo** `UPDATE`, e substitui `updatedAt` pelo instante atual — não importa qual campo mudou.

Como `Cliente`/`Agendamento` usam `@GeneratedValue(strategy = GenerationType.IDENTITY)`, o Hibernate é obrigado a executar o `INSERT` imediatamente no `save()` (não pode adiar/lote, porque precisa do ID gerado pelo banco de volta) — na prática isso significa que `createdAt`/`updatedAt` já vêm preenchidos na própria entidade retornada por `repository.save(...)`, sem exigir nenhuma anotação `@Transactional` adicional nos services (nenhuma foi adicionada nesta mudança).

A coluna, em ambos os bancos (migration `V2__add_audit_fields.sql`), também tem `DEFAULT CURRENT_TIMESTAMP` a nível de SQL. Isso não é redundante com o Hibernate — é uma rede de segurança: se algum dia algo inserir uma linha nessas tabelas por fora da aplicação (uma migração de dados, um script manual), a coluna ainda assim nunca fica nula.

## Fluxo completo

```
Cliente/AgendamentoRequest chega no Controller (sem createdAt/updatedAt)
        │
        ▼
Service monta a Entity (createdAt/updatedAt ainda não existem em memória)
        │
        ▼
repository.save(entity)
        │
        ├── É uma criação? → Hibernate dispara @PrePersist → createdAt = agora, updatedAt = agora
        │
        └── É uma atualização? → Hibernate dispara @PreUpdate → updatedAt = agora (createdAt intocado)
        │
        ▼
Service converte a Entity salva em ...Response.de(entity)
        │
        ▼
Resposta HTTP já inclui createdAt/updatedAt
```

## Como isso prepara o CRM para relatórios futuros

Esta mudança, por si só, não cria nenhuma tela nem endpoint de relatório novo — mas é o pré-requisito para todos eles. Com `created_at`/`updated_at` gravados de forma confiável desde a origem, passam a ser possíveis, sem retrabalho de dado:

- **Métricas de aquisição**: novos clientes por dia/semana/mês (`GROUP BY DATE(created_at)`).
- **Velocidade do funil**: tempo médio entre `created_at` e a mudança para `GANHO`/`PERDIDO`, cruzando com o histórico de status (se um dia existir uma tabela de histórico de transições).
- **Detecção de estagnação**: clientes cujo `updated_at` está há muito tempo no passado, mesmo que ainda estejam em uma etapa "ativa" do funil (`NEGOCIACAO`, `PROPOSTA`) — hoje impossível de saber, porque não havia como distinguir "não mudou" de "não sabemos quando foi a última vez".
- **Auditoria/suporte**: reconstruir quando um registro específico foi tocado pela última vez, sem precisar de log de aplicação para isso.

Nenhuma dessas telas foi implementada aqui — o objetivo desta tarefa era só garantir que o dado necessário para construí-las já está sendo capturado corretamente, de forma automática e sem intervenção manual, a partir de agora.

## Testes

- **`TimestampAuditoriaTest`** (`@DataJpaTest`, não Mockito): prova o comportamento real do Hibernate contra um H2 de verdade, com as migrations `V1`+`V2` aplicadas pelo Flyway. Um `repository` mockado (como em `ClienteServiceTest`/`AgendamentoServiceTest`) nunca dispara `@PrePersist`/`@PreUpdate` de verdade — só devolve o que foi programado no mock — então esses testes exigiam subir um contexto JPA real. Cobre: criação preenche os dois campos; atualização muda `updatedAt` e mantém `createdAt` intacto; mesmo cenário para `Cliente` e `Agendamento`.
- **`ClienteResponseTest`/`AgendamentoResponseTest`**: testes unitários simples confirmando que `...Response.de(entity)` carrega `createdAt`/`updatedAt` corretamente para o DTO — usam `ReflectionTestUtils` para simular uma entidade já persistida, já que os campos não têm setter público (mesmo padrão já usado no projeto para simular o `id` gerado pelo banco).

## Débitos técnicos

1. **`V2` assume que o banco de produção aceita `TIMESTAMP ... DEFAULT CURRENT_TIMESTAMP` sem `ON UPDATE`** — o que é válido tanto em MySQL quanto em H2. Não foi adicionado `ON UPDATE CURRENT_TIMESTAMP` (sintaxe MySQL-específica, sem equivalente direto em H2) porque o `@UpdateTimestamp` do Hibernate já cobre esse comportamento a nível de aplicação; se um dia existir escrita direta em SQL fora da aplicação, `updated_at` não seria atualizado automaticamente por essa via.
2. **Sem coluna equivalente em `usuarios`.** A tarefa pediu auditoria só para clientes e agendamentos ("os principais dados do sistema"); `Usuario` ficou de fora deliberadamente. Se fizer sentido depois, é o mesmo padrão (`V3`, `@CreationTimestamp`/`@UpdateTimestamp`, adicionar ao `UsuarioResponse`).
3. **Não existe histórico de mudanças de status** (`StatusLead`), só a "última atualização" do registro como um todo — `updated_at` muda com qualquer alteração (nome, telefone, status, etc.), não só transições de funil. Uma tabela de histórico dedicada (`cliente_status_historico`) seria o próximo passo natural para relatórios de "tempo em cada etapa", mas é uma feature nova, fora do escopo desta tarefa.
