package com.kaique.crm_simples.repository;

import com.kaique.crm_simples.model.Cliente;
import com.kaique.crm_simples.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    List<Cliente> findByUsuario(Usuario usuario);
}