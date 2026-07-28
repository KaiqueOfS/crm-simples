# Rate limiting no login

## Vulnerabilidade anterior

`POST /api/auth/login` aceitava um volume ilimitado de tentativas. Nada no `AuthController` nem no `SecurityConfig` impedia um script de tentar centenas de senhas por segundo contra o mesmo e-mail (força bruta clássica) ou testar a mesma senha comum contra uma lista grande de e-mails (credential stuffing / password spraying). Isso já constava como item **P0** na auditoria de segurança anterior do backend (ver conversa/relatório de auditoria): "Ausência total de rate limiting em autenticação".

O `JwtFilter` protege rotas autenticadas, mas isso não ajuda aqui — `/api/auth/login` é, por definição, pública (`SecurityConfig` já libera `/api/auth/**` com `permitAll()`, e continua liberando; essa parte não mudou).

## Solução aplicada

Um limitador de tentativas em memória, usando **Bucket4j** (`com.bucket4j:bucket4j-core`), com dois buckets independentes por tentativa de login:

- **Por IP** — evita que uma única origem tente muitas senhas contra muitos e-mails diferentes.
- **Por e-mail** — evita que uma conta específica seja atacada a partir de vários IPs diferentes (o que só limitar por IP não pegaria).

```java
public boolean tentativaPermitida(String ip, String email) {
    boolean permitidoIp = bucketDoIp(ip).tryConsume(1);
    boolean permitidoEmail = bucketDoEmail(email).tryConsume(1);
    return permitidoIp && permitidoEmail;
}
```

O `AuthController` consulta isso **antes** de qualquer acesso ao `UsuarioService`/banco:

```java
if (!rateLimiter.tentativaPermitida(obterIp(httpRequest), request.getEmail())) {
    throw new MuitasTentativasException();
}
```

- **`MuitasTentativasException` → HTTP 429 (Too Many Requests)**, com mensagem genérica ("Muitas tentativas de login. Tente novamente em instantes.") que **não diz** se foi o limite de IP, de e-mail, ou os dois — evita dar a um atacante um sinal extra sobre qual limite ele está testando.
- **O comportamento de `CredenciaisInvalidasException` não mudou.** Quando a tentativa é permitida (dentro do limite), o fluxo de senha errada / e-mail inexistente continua idêntico ao que já existia — mesma exceção, mesmo status 401, mesma prevenção de user enumeration. Rate limiting é uma camada **antes** da validação de credenciais, não uma substituição dela.
- **Nenhuma consulta ao banco acontece quando bloqueado.** Isso por si só já reforça "não revelar se o usuário existe": quando o limite é atingido, a resposta é sempre a mesma (429 genérico), independente de o e-mail testado existir ou não.

## Por que em memória (e não Redis/banco)

A aplicação roda como instância única — não há Redis, cache distribuído, nem qualquer coordenação entre instâncias no projeto hoje. Um `ConcurrentHashMap<String, Bucket>` por processo é a solução do tamanho certo para esse estágio: simples, sem infraestrutura nova, sem outra dependência de rede que poderia falhar e derrubar o login. Bucket4j foi escolhido exatamente porque **não força** essa escolha: se a aplicação um dia escalar horizontalmente (múltiplas instâncias atrás de um load balancer), o mesmo `Bandwidth`/`Refill` pode ser reaproveitado trocando só o backend de armazenamento dos buckets (Bucket4j tem suporte nativo a Redis, Hazelcast, Infinispan, JCache, etc., via seu mecanismo de `ProxyManager`) — sem reescrever a regra de negócio do limite em si.

## Configuração

Em `application.properties` (mesmos valores em produção e teste, salvo indicação contrária):

```properties
app.rate-limit.login.max-tentativas-email=5
app.rate-limit.login.max-tentativas-ip=10
app.rate-limit.login.janela-segundos=60
```

| Propriedade | Padrão | Significado |
|---|---|---|
| `max-tentativas-email` | 5 | Tentativas de login permitidas para o mesmo e-mail, por janela |
| `max-tentativas-ip` | 10 | Tentativas de login permitidas para o mesmo IP, por janela |
| `janela-segundos` | 60 | Duração da janela deslizante, em segundos |

O e-mail é normalizado (`trim()` + minúsculas) antes de virar chave do bucket — `Ana@Teste.com` e `ana@teste.com ` contam para o mesmo orçamento.

## Como alterar os limites no futuro

Só editar as três propriedades acima — não é necessário recompilar lógica nenhuma. Nenhum outro arquivo precisa mudar para ajustar os números.

Se o requisito mudar de "X tentativas por Y segundos" para algo mais sofisticado (ex.: bloqueio progressivo, captcha após N falhas, notificação por e-mail ao dono da conta), o ponto de extensão é só o `LoginRateLimiter` — o `AuthController` só depende do método `tentativaPermitida(ip, email): boolean`, então qualquer evolução da regra fica contida nessa classe.

## Testes

- **`LoginRateLimiterTest`** (unitário, sem Spring): instancia o limitador diretamente com limites pequenos e janela curta — prova bloqueio ao exceder o limite, isolamento entre e-mails diferentes, isolamento entre bloqueio por IP vs. por e-mail, normalização do e-mail, e liberação depois que a janela expira (com um `Thread.sleep` curto, já que a janela do teste é de 1 segundo).
- **`AuthControllerTest`** (unitário, Mockito): prova que, quando o rate limiter nega a tentativa, `MuitasTentativasException` é lançada e o `UsuarioService` **nunca é consultado** — o bloqueio acontece estritamente antes de qualquer acesso a dado de usuário.
- **`SecurityIntegrationTest`** (`@SpringBootTest` + MockMvc, cadeia real): um novo teste registra um usuário de verdade, esgota o limite de tentativas por e-mail (padrão: 5) com senha errada, e confirma que a 6ª tentativa — mesmo com a senha **correta** — retorna 429. Usa `@DirtiesContext(AFTER_METHOD)` porque o `LoginRateLimiter` é um bean singleton compartilhado entre todos os testes que reusam o mesmo contexto Spring; sem isso, as tentativas consumidas nesse teste vazariam para os demais cenários da classe.

## Débitos técnicos

1. **Sem reset manual/administrativo.** Se um usuário legítimo for bloqueado por engano (ex.: esqueceu a senha e tentou várias vezes), não existe hoje um endpoint ou ação de suporte para liberar o bucket antes da janela expirar — só esperar.
2. **`obterIp` confia em `X-Forwarded-For` sem validação de proxy confiável.** Isso é aceitável hoje (não há proxy configurado na frente da aplicação), mas se um dia houver um reverse proxy, esse header precisa ser validado/sanitizado (só confiar nele quando a requisição realmente vier do proxy conhecido) — caso contrário, um cliente poderia forjar `X-Forwarded-For` para meio que "trocar de IP" a cada tentativa e contornar o limite por IP (o limite por e-mail continuaria valendo normalmente).
3. **Estado em memória não sobrevive a um restart da aplicação** (reinicia zerado) nem é compartilhado caso a aplicação rode em mais de uma instância — ver seção "Por que em memória" acima; migrar para um `ProxyManager` distribuído do Bucket4j é o caminho natural se isso vier a importar.
4. **Sem métrica/alerta quando o limite é atingido com frequência.** Hoje isso não gera log nem alerta — só o 429 para o cliente. Instrumentar isso (contador/log estruturado quando `MuitasTentativasException` é lançada) ajudaria a detectar um ataque em andamento, não só bloqueá-lo silenciosamente.
