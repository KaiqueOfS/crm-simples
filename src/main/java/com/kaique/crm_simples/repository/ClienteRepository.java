package com.kaique.crm_simples.repository;

import com.kaique.crm_simples.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
}