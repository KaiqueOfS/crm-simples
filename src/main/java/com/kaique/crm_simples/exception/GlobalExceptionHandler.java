package com.kaique.crm_simples.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * Intercepta exceções lançadas pelos controllers e devolve
 * respostas padronizadas em JSON.
 *
 * Sem essa classe, o Spring devolveria páginas de erro HTML
 * ou mensagens técnicas difíceis de entender.
 * Aqui centralizamos tudo em um lugar só.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Trata erros de validação gerados pelo @Valid.
     *
     * Quando um campo não passa nas anotações de validação
     * (@NotBlank, @Email, @Size, etc.), retorna um mapa com
     * o nome do campo e a mensagem de erro correspondente.
     *
     * Exemplo de resposta:
     * {
     *   "email": "E-mail inválido",
     *   "senha": "Senha deve ter no mínimo 6 caracteres"
     * }
     *
     * @param ex exceção de validação lançada pelo Spring.
     * @return mapa de campo → mensagem de erro (HTTP 422).
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> tratarValidacao(
            MethodArgumentNotValidException ex) {

        Map<String, String> erros = new HashMap<>();

        // Percorre todos os campos com erro e monta o mapa de resposta
        ex.getBindingResult()
                .getFieldErrors()
                .forEach(erro ->
                        erros.put(erro.getField(), erro.getDefaultMessage()));

        return ResponseEntity
                .status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(erros);
    }

    /**
     * Trata tentativas de cadastro com e-mail já existente.
     *
     * Usamos 409 Conflict porque é exatamente isso:
     * o recurso já existe e há um conflito.
     *
     * @param ex exceção lançada pelo UsuarioService.
     * @return mensagem de erro (HTTP 409).
     */
    @ExceptionHandler(EmailJaCadastradoException.class)
    public ResponseEntity<Map<String, String>> tratarEmailJaCadastrado(
            EmailJaCadastradoException ex) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(Map.of("erro", ex.getMessage()));
    }

    /**
     * Trata o caso em que um cliente não é encontrado pelo ID.
     *
     * @param ex exceção lançada pelo ClienteService.
     * @return mensagem de erro (HTTP 404).
     */
    @ExceptionHandler(ClienteNaoEncontradoException.class)
    public ResponseEntity<Map<String, String>> tratarClienteNaoEncontrado(
            ClienteNaoEncontradoException ex) {

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of("erro", ex.getMessage()));
    }

    /**
     * Trata tentativas de acesso a clientes de outro usuário.
     *
     * @param ex exceção lançada pelo ClienteService.
     * @return mensagem de erro (HTTP 403).
     */
    @ExceptionHandler(AcessoNegadoException.class)
    public ResponseEntity<Map<String, String>> tratarAcessoNegado(
            AcessoNegadoException ex) {

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(Map.of("erro", ex.getMessage()));
    }

    /**
     * Trata tentativas de login com credenciais inválidas.
     *
     * Usamos 401 Unauthorized porque o usuário não se identificou
     * corretamente — diferente de 403 onde ele se identificou
     * mas não tem permissão.
     *
     * @param ex exceção lançada pelo AuthController.
     * @return mensagem de erro (HTTP 401).
     */
    @ExceptionHandler(CredenciaisInvalidasException.class)
    public ResponseEntity<Map<String, String>> tratarCredenciaisInvalidas(
            CredenciaisInvalidasException ex) {

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("erro", ex.getMessage()));
    }

    /**
     * Trata o caso em que as senhas não coincidem na atualização do perfil.
     *
     * @param ex exceção lançada pelo UsuarioService.
     * @return mensagem de erro (HTTP 400).
     */
    @ExceptionHandler(SenhasNaoCoincidemException.class)
    public ResponseEntity<Map<String, String>> tratarSenhasNaoCoincidem(
            SenhasNaoCoincidemException ex) {

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("erro", ex.getMessage()));
    }

    /**
     * Trata o caso em que um usuário não é encontrado pelo e-mail.
     *
     * @param ex exceção lançada pelo UsuarioService.
     * @return mensagem de erro (HTTP 404).
     */
    @ExceptionHandler(UsuarioNaoEncontradoException.class)
    public ResponseEntity<Map<String, String>> tratarUsuarioNaoEncontrado(
            UsuarioNaoEncontradoException ex) {

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of("erro", ex.getMessage()));
    }

    /**
     * Trata exceções genéricas não mapeadas pelos handlers anteriores.
     *
     * É o "plano B" — garante que nenhum erro inesperado
     * vaze detalhes internos do sistema para o usuário.
     *
     * @param ex exceção genérica.
     * @return mensagem de erro genérica (HTTP 400).
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> tratarRuntimeException(
            RuntimeException ex) {

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("erro", ex.getMessage()));
    }
}