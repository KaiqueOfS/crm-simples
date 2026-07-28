# Migração de banco com Flyway

## Problema resolvido

Até esta mudança, o schema do banco era inteiramente gerenciado pelo Hibernate em tempo de execução, via `spring.jpa.hibernate.ddl-auto=update`. Isso significa que, toda vez que a aplicação subia, o Hibernate comparava as entidades JPA com o schema existente e aplicava as diferenças automaticamente — criando tabelas, adicionando colunas, etc.

Isso funciona para prototipagem, mas é inadequado para produção pelos seguintes motivos:

- **Nenhum histórico.** Não existe registro de quando ou por que uma coluna foi adicionada, renomeada ou teve o tipo alterado.
- **Nenhuma revisão.** Uma mudança de schema nunca passa por code review como SQL explícito — ela só existe implicitamente na entidade Java.
- **Nenhuma reprodutibilidade.** Não há como recriar o schema exato de produção do zero (disaster recovery, ambiente novo, onboarding) além de "rodar a aplicação e torcer".
- **Risco real de perda de dado.** `ddl-auto=update` pode, dependendo da mudança, falhar silenciosamente ou aplicar uma alteração incompatível (ex.: estreitar um tipo de coluna) sem pedir confirmação e sem oferecer rollback.

## Arquitetura antiga

```
Aplicação sobe
      │
      ▼
Hibernate lê as entidades JPA (@Entity)
      │
      ▼
Hibernate compara com o schema atual do banco
      │
      ▼
Hibernate aplica CREATE/ALTER automaticamente (ddl-auto=update)
      │
      ▼
Aplicação começa a aceitar requisições
```

O schema era, na prática, um *efeito colateral* de rodar a aplicação — nunca um artefato versionado e revisável por si só.

## Arquitetura nova

```
Aplicação sobe
      │
      ▼
Flyway lê src/main/resources/db/migration/V*.sql
      │
      ▼
Flyway consulta a tabela flyway_schema_history
      │
      ▼
Flyway aplica, em ordem, só as migrations ainda não registradas
      │
      ▼
Hibernate lê as entidades JPA e VALIDA contra o schema
(ddl-auto=validate — nunca cria, altera ou apaga nada)
      │
      ├── Schema bate com as entidades → aplicação sobe normalmente
      │
      └── Schema NÃO bate com as entidades → a aplicação falha ao subir
          (em vez de aplicar uma mudança silenciosa em produção)
      │
      ▼
Aplicação começa a aceitar requisições
```

O schema agora é um artefato de primeira classe: arquivos `.sql` versionados no Git, revisáveis em PR, com histórico completo de quando cada mudança foi introduzida e aplicáveis de forma idêntica em qualquer ambiente (dev, teste, produção).

## Migration inicial (`V1__init.sql`)

`V1__init.sql` congela o schema que o Hibernate já vinha gerando via `ddl-auto=update`, derivado diretamente das três entidades existentes (`Usuario`, `Cliente`, `Agendamento`) — tabelas, colunas, tipos, chave estrangeira `usuario_id` em `clientes`/`agendamentos` e a constraint `UNIQUE` em `usuarios.email`. Nenhuma tabela, coluna ou constraint nova foi introduzida nesta migration: o objetivo dela é ser um ponto de partida fiel ao estado atual, não uma correção de schema.

Isso tem uma consequência importante, documentada também no relatório de débitos técnicos: como nenhuma entidade usa `@Column(nullable = false)`, **nenhuma coluna do schema atual é `NOT NULL` a nível de banco** — nem `usuario_id`, nem campos obrigatórios como `Cliente.nome` ou `Agendamento.data`. A obrigatoriedade hoje existe só na camada de validação da API (`@NotBlank`, `@NotNull`), não no banco. `V1__init.sql` replica esse comportamento exatamente como está, em vez de "corrigi-lo" por conta própria — endurecer essas colunas é uma decisão de produto/migração que deve vir depois, numa `V2` deliberada, não escondida dentro do baseline.

## Como validar que a migration está correta

A prova mais forte disso não é leitura de código, é o próprio `mvn test`: com `ddl-auto=validate`, os testes só passam se o schema criado pelo Flyway (agora também usado pelo H2 nos testes) bater exatamente com o que as entidades esperam. Se `V1__init.sql` estivesse errado — uma coluna faltando, um tipo incompatível — o Hibernate teria recusado a subir o contexto e todo o teste teria falhado no boot, não silenciosamente.

## Como evoluir o schema a partir de agora

1. Nunca edite uma migration já aplicada (em produção ou já commitada/mergeada).
2. Crie um novo arquivo `V{N+1}__descricao_curta.sql` em `src/main/resources/db/migration/`.
3. Escreva o `ALTER TABLE`/`CREATE TABLE` necessário — revisável em PR como qualquer outro código.
4. Suba a aplicação (ou rode os testes): o Flyway aplica a migration nova automaticamente, na ordem, e passa a validar contra o schema atualizado.

`ddl-auto` permanece em `validate` em todos os ambientes — produção e teste. Isso não é negociável: é a garantia de que nenhuma mudança de schema entra em produção sem passar por um arquivo de migration revisado.
