package com.kaique.crm_simples.repository;

import com.kaique.crm_simples.model.Cliente;
import com.kaique.crm_simples.model.StatusLead;
import com.kaique.crm_simples.model.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Repositório responsável pelas operações de banco relacionadas aos clientes.
 */
public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    // Busca todos os clientes de um usuário
    Page<Cliente> findByUsuario(Usuario usuario, Pageable pageable);

    Page<Cliente> findByUsuarioAndStatus(Usuario usuario, StatusLead status, Pageable pageable);

    @Query("""
            SELECT c FROM Cliente c
            WHERE c.usuario = :usuario
              AND (LOWER(c.nome) LIKE LOWER(CONCAT('%', :termo, '%'))
                   OR LOWER(COALESCE(c.email, '')) LIKE LOWER(CONCAT('%', :termo, '%'))
                   OR COALESCE(c.telefone, '') LIKE CONCAT('%', :termo, '%'))
            """)
    Page<Cliente> buscarPorUsuarioETermo(
            @Param("usuario") Usuario usuario,
            @Param("termo") String termo,
            Pageable pageable);

    /**
     * Conta clientes de um usuário por status.
     * Usado pelo dashboard — muito mais eficiente do que
     * buscar todos e filtrar em memória.
     *
     * @param usuario usuário autenticado.
     * @param status  etapa do funil.
     * @return quantidade de clientes nessa etapa.
     */
    @Query("SELECT COUNT(c) FROM Cliente c WHERE c.usuario = :usuario AND c.status = :status")
    long contarPorStatus(@Param("usuario") Usuario usuario, @Param("status") StatusLead status);

    /**
     * Conta o total de clientes de um usuário.
     *
     * @param usuario usuário autenticado.
     * @return total de clientes.
     */
    long countByUsuario(Usuario usuario);
}
