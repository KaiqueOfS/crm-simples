package com.kaique.crm_simples.repository;

import com.kaique.crm_simples.model.Agendamento;
import com.kaique.crm_simples.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repositório responsável pelas operações de banco
 * relacionadas aos agendamentos.
 */
public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {

    // Busca todos os agendamentos de um usuário
    List<Agendamento> findByUsuarioOrderByDataAscHoraAsc(Usuario usuario);

    // Busca agendamentos de um usuário em uma data específica
    List<Agendamento> findByUsuarioAndDataOrderByHoraAsc(Usuario usuario, LocalDate data);

    // Busca agendamentos de um usuário em um intervalo de datas
    List<Agendamento> findByUsuarioAndDataBetweenOrderByDataAscHoraAsc(
            Usuario usuario, LocalDate inicio, LocalDate fim);
}