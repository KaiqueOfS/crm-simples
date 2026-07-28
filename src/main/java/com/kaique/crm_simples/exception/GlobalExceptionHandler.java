package com.kaique.crm_simples.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

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