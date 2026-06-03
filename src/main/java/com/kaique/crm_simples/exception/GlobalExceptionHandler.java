package com.kaique.crm_simples.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UsuarioNaoEncontradoException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, String> tratarUsuarioNaoEncontrado(
            UsuarioNaoEncontradoException ex) {

        return Map.of(
                "erro", ex.getMessage()
        );
    }

    @ExceptionHandler(CredenciaisInvalidasException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public Map<String, String> tratarCredenciaisInvalidas(
            CredenciaisInvalidasException ex) {

        return Map.of(
                "erro", ex.getMessage()
        );
    }
}