package com.kaique.crm_simples.service;

import com.kaique.crm_simples.model.Usuario;
import com.kaique.crm_simples.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.util.Optional;
import java.util.List;

@Service
public class UsuarioService {

    private final UsuarioRepository repository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UsuarioService(
            UsuarioRepository repository,
            BCryptPasswordEncoder passwordEncoder) {

        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    public Usuario salvar(Usuario usuario) {

        usuario.setSenha(
                passwordEncoder.encode(usuario.getSenha())
        );

        return repository.save(usuario);
    }

    public List<Usuario> listarTodos() {
        return repository.findAll();
    }
    public Optional<Usuario> buscarPorEmail(String email) {
        return repository.findByEmail(email);
    }
}