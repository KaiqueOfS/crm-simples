package com.kaique.crm_simples.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.HashMap;
import java.util.Map;

/**
 * Intercepta exceções e retorna respostas padronizadas em JSON.
 *
 * Cada tipo de exceção tem seu próprio handler com o
 * status HTTP correto. O handler genérico de RuntimeException
 * foi separado do handler de Exception para não mascarar
 * erros graves (como falha no banco) com HTTP 400.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Trata erros de validação do @Valid.
     * Retorna um mapa com campo → mensagem de erro.
     * HTTP 422 Unprocessable Entity.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> tratarValidacao(
            MethodArgumentNotValidException ex) {

        Map<String, String> erros = new HashMap<>();
        ex.getBindingResult()
                .getFieldErrors()
                .forEach(e -> erros.put(e.getField(), e.getDefaultMessage()));

        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(erros);
    }

    /**
     * Trata parâmetro de URL (query param ou path variable) com tipo errado
     * — ex.: `?status=INEXISTENTE` (não é um StatusLead válido) ou
     * `/api/clientes/abc` (id não é um Long). Sem este handler, o Spring
     * devolve a mensagem crua da conversão, com nome de classe Java
     * incluso (ex.: "Failed to convert value of type 'java.lang.String'
     * to required type 'com.kaique...StatusLead'").
     * HTTP 400 Bad Request.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> tratarParametroInvalido(
            MethodArgumentTypeMismatchException ex) {

        String mensagem = "status".equals(ex.getName())
                ? "Status inválido."
                : "Parâmetro inválido.";

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("erro", mensagem));
    }

    /**
     * Trata corpo da requisição ilegível — JSON malformado ou um valor de
     * enum inválido dentro do corpo (ex.: {"status": "NAO_EXISTE"}). Sem
     * este handler, o Spring devolve a mensagem crua do Jackson, com nome
     * de classe Java incluso (ex.: "Cannot deserialize value of type
     * com.kaique...StatusLead from String \"NAO_EXISTE\"").
     * HTTP 400 Bad Request.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> tratarCorpoInvalido(
            HttpMessageNotReadableException ex) {

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("erro", "Dados enviados inválidos."));
    }

    /**
     * Trata e-mail já cadastrado no sistema.
     * HTTP 409 Conflict.
     */
    @ExceptionHandler(EmailJaCadastradoException.class)
    public ResponseEntity<Map<String, String>> tratarEmailJaCadastrado(
            EmailJaCadastradoException ex) {

        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("erro", ex.getMessage()));
    }

    /**
     * Trata cliente não encontrado pelo ID.
     * HTTP 404 Not Found.
     */
    @ExceptionHandler(ClienteNaoEncontradoException.class)
    public ResponseEntity<Map<String, String>> tratarClienteNaoEncontrado(
            ClienteNaoEncontradoException ex) {

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("erro", ex.getMessage()));
    }

    /**
     * Trata agendamento não encontrado pelo ID.
     * HTTP 404 Not Found.
     */
    @ExceptionHandler(AgendamentoNaoEncontradoException.class)
    public ResponseEntity<Map<String, String>> tratarAgendamentoNaoEncontrado(
            AgendamentoNaoEncontradoException ex) {

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("erro", ex.getMessage()));
    }

    /**
     * Trata acesso a recursos de outro usuário.
     * HTTP 403 Forbidden.
     */
    @ExceptionHandler(AcessoNegadoException.class)
    public ResponseEntity<Map<String, String>> tratarAcessoNegado(
            AcessoNegadoException ex) {

        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("erro", ex.getMessage()));
    }

    /**
     * Trata login com credenciais inválidas.
     * HTTP 401 Unauthorized.
     */
    @ExceptionHandler(CredenciaisInvalidasException.class)
    public ResponseEntity<Map<String, String>> tratarCredenciaisInvalidas(
            CredenciaisInvalidasException ex) {

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("erro", ex.getMessage()));
    }

    /**
     * Trata excesso de tentativas de login (rate limiting por IP/e-mail).
     * HTTP 429 Too Many Requests.
     */
    @ExceptionHandler(MuitasTentativasException.class)
    public ResponseEntity<Map<String, String>> tratarMuitasTentativas(
            MuitasTentativasException ex) {

        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Map.of("erro", ex.getMessage()));
    }

    /**
     * Trata usuário não encontrado.
     * HTTP 404 Not Found.
     */
    @ExceptionHandler(UsuarioNaoEncontradoException.class)
    public ResponseEntity<Map<String, String>> tratarUsuarioNaoEncontrado(
            UsuarioNaoEncontradoException ex) {

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("erro", ex.getMessage()));
    }

    /**
     * Trata senhas que não coincidem na atualização do perfil.
     * HTTP 400 Bad Request.
     */
    @ExceptionHandler(SenhasNaoCoincidemException.class)
    public ResponseEntity<Map<String, String>> tratarSenhasNaoCoincidem(
            SenhasNaoCoincidemException ex) {

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("erro", ex.getMessage()));
    }

    /**
     * Trata criação de agendamento sem local de atendimento informado,
     * quando a conta exige essa escolha (tipo de atendimento AMBOS).
     * HTTP 400 Bad Request.
     */
    @ExceptionHandler(LocalAtendimentoObrigatorioException.class)
    public ResponseEntity<Map<String, String>> tratarLocalAtendimentoObrigatorio(
            LocalAtendimentoObrigatorioException ex) {

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("erro", ex.getMessage()));
    }

    /**
     * Trata nome inválido (caracteres não permitidos ou nome incompleto)
     * no cadastro/edição de cliente.
     * HTTP 400 Bad Request.
     */
    @ExceptionHandler(NomeInvalidoException.class)
    public ResponseEntity<Map<String, String>> tratarNomeInvalido(
            NomeInvalidoException ex) {

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("erro", ex.getMessage()));
    }

    /**
     * Trata senha inválida (ex.: tamanho acima do limite do BCrypt) no
     * cadastro ou na troca de senha do perfil.
     * HTTP 400 Bad Request.
     */
    @ExceptionHandler(SenhaInvalidaException.class)
    public ResponseEntity<Map<String, String>> tratarSenhaInvalida(
            SenhaInvalidaException ex) {

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("erro", ex.getMessage()));
    }

    /**
     * Trata violação de integridade do banco (constraint, truncamento,
     * chave duplicada não coberta por um handler específico, etc.).
     * HTTP 500 Internal Server Error.
     *
     * IMPORTANTE: DataIntegrityViolationException é uma RuntimeException,
     * então precisa de handler próprio aqui em cima — senão cairia no
     * handler genérico de RuntimeException logo abaixo, que devolve a
     * mensagem crua do driver JDBC/Hibernate (nome de tabela/coluna/
     * constraint) como erro 400 para o cliente.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> tratarViolacaoIntegridade(
            DataIntegrityViolationException ex) {

        log.error("Violação de integridade no banco de dados", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("erro", "Não foi possível salvar os dados. Tente novamente."));
    }

    /**
     * Trata erros de negócio genéricos (RuntimeException conhecidas).
     * HTTP 400 Bad Request.
     *
     * IMPORTANTE: separado do handler de Exception para não
     * mascarar erros de infraestrutura (banco, rede) com 400.
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> tratarRuntimeException(
            RuntimeException ex) {

        log.warn("RuntimeException não mapeada: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("erro", ex.getMessage()));
    }

    /**
     * Trata erros inesperados de infraestrutura.
     * HTTP 500 Internal Server Error.
     *
     * Não expõe detalhes técnicos para o cliente — apenas loga.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> tratarErroInterno(Exception ex) {

        log.error("Erro interno inesperado", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("erro", "Ocorreu um erro interno. Tente novamente."));
    }
}