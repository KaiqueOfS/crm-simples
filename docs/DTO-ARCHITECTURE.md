# Arquitetura de DTOs — Controller → DTO → Service → Entity

## Motivo da mudança

Até esta refatoração, os controllers de `Cliente`, `Agendamento` e `Usuario` recebiam e devolviam as próprias entidades JPA diretamente como corpo de requisição/resposta (`@RequestBody Cliente`, retorno `Cliente`, etc.). Isso funciona, mas acopla o contrato público da API à estrutura interna de persistência — qualquer coisa que exista na entidade vira, por padrão, algo que o cliente da API pode ler ou tentar escrever.

## Problema anterior

Concretamente, expor a entidade como contrato causava três problemas:

1. **Superfície de escrita maior que o necessário.** `Cliente` tem um campo `usuario` (`@ManyToOne`). Como o `@RequestBody` desserializava a entidade inteira, nada no tipo impedia, em tese, que um corpo de requisição malicioso tentasse enviar `"usuario": {"id": 999}`. O sistema só ficava seguro porque `ClienteService.salvar`/`AgendamentoService.salvar` **sempre** sobrescreviam esse campo com o usuário autenticado antes de persistir — uma garantia por *convenção de código*, não por *impossibilidade estrutural*. Um novo método de escrita que esquecesse de repetir esse `set` teria reintroduzido a falha silenciosamente.
2. **Vazamento de dado redundante.** `Cliente` aninha o objeto `Usuario` inteiro (`@JsonIgnoreProperties({"senha"})` só escondia a senha). Toda resposta de `/api/clientes` carregava `id`/`nome`/`email` do dono, redundantemente, em cada cliente da lista.
3. **Acoplamento de evolução.** Qualquer coluna nova na entidade (ex.: um campo interno de auditoria) automaticamente passava a ser aceita ou exposta pela API, sem nenhuma decisão explícita — o schema de banco e o contrato da API eram, na prática, a mesma coisa.

## Novo fluxo

```
Requisição HTTP (JSON)
        │
        ▼
Controller  ──►  valida e desserializa em um ...Request (@Valid)
        │            nome, telefone, email, observacoes, statusLead
        │            (SEM id, SEM usuario — o tipo não tem esses campos)
        ▼
Service  ──►  busca o usuário autenticado (UsuarioAutenticadoService)
        │     monta/atualiza a Entity, atribuindo o dono explicitamente
        │     aqui — nunca a partir do request
        ▼
Repository  ──►  persiste a Entity (sem mudança nenhuma aqui)
        │
        ▼
Service  ──►  converte a Entity salva em um ...Response
        │     (record com fábrica estática ...Response.de(entity))
        ▼
Controller  ──►  devolve o Response
        │
        ▼
Resposta HTTP (JSON)
```

Cada domínio ganhou:

| Domínio | Request | Response |
|---|---|---|
| Cliente | `ClienteRequest` (nome, telefone, email, observacoes, statusLead) | `ClienteResponse` (+ id) |
| Agendamento | `AgendamentoRequest` (titulo, pessoa, data, hora, categoria, lembrete) | `AgendamentoResponse` (+ id) |
| Usuario | *(mantido: `AtualizarPerfilRequest` já existia; cadastro segue recebendo `Usuario`, ver Débitos)* | `UsuarioResponse` (id, nome, email — nunca senha) |

A conversão Entity → Response segue o mesmo padrão que já existia no projeto para paginação (`PaginaResponse.de(Page<T>)`): cada `Response` é um `record` com uma fábrica estática `de(Entity)`. A conversão Request → Entity fica no Service, junto da regra de negócio, porque é lá que o dono (`usuario`) é atribuído — colocar esse mapeamento na própria entidade (`Entity.of(Request)`) criaria uma dependência de `model` sobre `dto`, invertendo a direção correta de dependência (o domínio não deveria conhecer o contrato de API).

## O dono do recurso nunca vem do request

Isso não é só uma regra seguida por convenção — agora é **estruturalmente impossível** de violar, porque `ClienteRequest` e `AgendamentoRequest` simplesmente não têm campo `usuario` nem `id`. Não existe setter para chamar. O dono é sempre resolvido assim, em ambos os services:

```java
Usuario usuario = usuarioAutenticadoService.obterUsuarioLogado();
// ...
entidade.setUsuario(usuario); // sempre o autenticado, nunca o que veio no corpo
```

Isso é verificado por dois ângulos de teste (ver seção seguinte): comportamento (o service sempre associa o autenticado) e estrutura (o DTO não tem como carregar outra coisa).

## Benefícios de segurança

- **IDOR por design impossível, não por disciplina.** Antes, a proteção contra "criar um cliente em nome de outro usuário" dependia de nenhum service esquecer de sobrescrever `usuario`. Agora, mesmo que um service futuro esqueça de setar o dono explicitamente, o pior cenário é uma entidade com `usuario = null` — nunca um cliente associado a outro usuário, porque a informação nunca chega a existir no request.
- **Superfície de exposição mínima e explícita.** `ClienteResponse`/`AgendamentoResponse` só têm os campos que a API deveria mesmo devolver. Uma coluna nova na entidade não vaza automaticamente — alguém precisa decidir adicioná-la ao Response.
- **`UsuarioResponse` nunca carrega senha**, nem por engano futuro: como o tipo não tem o campo, não há `@JsonProperty(WRITE_ONLY)` para depender — a ausência é garantida pelo compilador, não por uma anotação que alguém poderia remover sem perceber.
- **Validação de entrada centralizada no ponto de entrada certo.** `@Valid` roda sobre o DTO, na borda da API, antes de qualquer lógica de negócio — igual já acontecia, mas agora sem o efeito colateral de validar (e aceitar) campos que não deveriam nem existir na entrada.

## Testes

- `ClienteServiceTest` e `AgendamentoServiceTest` foram adaptados para os novos parâmetros de `Request`; os testes de isolamento entre usuários (buscar/atualizar/excluir/alterar status de recurso de outro usuário) continuam cobrindo exatamente os mesmos cenários de antes.
- Os testes de criação (`associaClienteNovoAoUsuarioAutenticado`, `associaAgendamentoNovoAoUsuarioAutenticado`) agora usam `ArgumentCaptor` para capturar a entidade que de fato chega ao `repository.save(...)` e confirmam que o dono é sempre o usuário autenticado do mock, nunca algo do request.
- **Novo:** `DtoSegurancaTest` — um teste estrutural (via reflection) que falha imediatamente se alguém adicionar um campo `usuario` ou `id` a `ClienteRequest`/`AgendamentoRequest`, ou um campo `senha` a `UsuarioResponse`. Não depende de ninguém lembrar de testar isso outra vez.

## Débitos técnicos e decisões que ficaram registradas

1. **`statusLead` no request tem nome diferente do campo `status` que o frontend hoje envia.** Isso foi pedido explicitamente nesta tarefa. Na prática não muda comportamento hoje: na criação, o frontend sempre envia `"status": "NOVO"`, que passa a ser ignorado (propriedade desconhecida) — mas `ClienteRequest.statusLead` tem o mesmo default (`NOVO`) que a entidade sempre teve, então o resultado final é idêntico. Na atualização, o campo de status já era ignorado pelo service antes desta mudança (existe endpoint próprio, `/status`), então o descompasso de nome não tem efeito nenhum aí. Ainda assim, é uma divergência de contrato real que precisa entrar no escopo de uma próxima tarefa de frontend.
2. **`POST /api/usuarios` (cadastro) continua recebendo a entidade `Usuario` diretamente como `@RequestBody`**, não um DTO de request. Não fazia parte do escopo pedido para "Usuário" (que pedia só `UsuarioResponse`), mas é o mesmo padrão de risco arquitetural descrito acima, só que do lado de entrada. Fica como próximo passo natural: criar `CadastroUsuarioRequest` (nome, email, senha) e mudar `UsuarioService.salvar` para aceitá-lo.
3. **`Cliente.observacoes`/`ClienteResponse.observacoes` continuam limitados a `VARCHAR(255)` no banco**, apesar da validação aceitar até 500 caracteres — débito já registrado em `docs/FLYWAY.md`, não introduzido por esta mudança, só reafirmado aqui porque `ClienteResponse` é agora o lugar formal onde esse campo é documentado.
4. **`ClienteResponse`/`AgendamentoResponse` não têm `criadoEm`/`atualizadoEm`** porque essas colunas não existem hoje nas entidades (nenhuma tem `@CreationTimestamp`/`@UpdateTimestamp`). Adicioná-las exigiria uma migration Flyway nova (`V2`) e não fazia parte desta tarefa — sinalizado aqui para não ser esquecido.
5. **As anotações de Bean Validation nas entidades (`Cliente`, `Agendamento`) ficaram redundantes**, já que a validação real agora acontece nos `Request` DTOs na borda da API. Não foram removidas nesta refatoração para manter o escopo contido, mas são candidatas naturais de limpeza numa próxima passada.
