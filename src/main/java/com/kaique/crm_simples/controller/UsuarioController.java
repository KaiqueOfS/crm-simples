package com.kaique.crm_simples.controller;

import com.kaique.crm_simples.model.Usuario;
import com.kaique.crm_simples.service.UsuarioService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioService service;

    public UsuarioController(UsuarioService service) {
        this.service = service;
    }

    @PostMapping
    public Usuario cadastrar(@RequestBody Usuario usuario) {
        return service.salvar(usuario);
    }

    @GetMapping
    public List<Usuario> listar() {
        return service.listarTodos();
    }
}