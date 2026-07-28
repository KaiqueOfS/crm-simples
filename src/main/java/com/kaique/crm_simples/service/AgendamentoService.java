package com.kaique.crm_simples.service;

import com.kaique.crm_simples.exception.AcessoNegadoException;
import com.kaique.crm_simples.exception.AgendamentoNaoEncontradoException;
import com.kaique.crm_simples.model.Agendamento;
import com.kaique.crm_simples.model.Usuario;
import com.kaique.crm_simples.repository.AgendamentoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Serviço responsável pelas regras de negócio dos agendamentos.
 *
 * Cada usuário só pode ver e editar seus próprios agendamentos.
 */
@Service
public class AgendamentoService {

    // Logger para registrar operações importantes em produção
    private static final Logger log = LoggerFactory.getLogger(AgendamentoService.class);

    private final AgendamentoRepository repository;
    private final UsuarioAutenticadoService usuarioAutenticadoService;

    public AgendamentoService(
            AgendamentoRepository repository,
            UsuarioAutenticadoService usuarioAutenticadoService) {
        this.repository = repository;
        this.usuarioAutenticadoService = usuarioAutenticadoService;
    }

    /**
     * Lista todos os agendamentos do usuário autenticado.
     * Ordenados por data e hora crescente.
     */
    public List<Agendamento> listarTodos() {
        Usuario usuario = usuarioAutenticadoService.obterUsuarioLogado();
        return repository.findByUsuarioOrderByDataAscHoraAsc(usuario);
    }

    /**
     * Lista agendamentos do usuário em uma data específica.
     * Usado para exibir a agenda do dia.
     *
     * @param data data a ser consultada.
     */
    public List<Agendamento> listarPorData(LocalDate data) {
        Usuario usuario = usuarioAutenticadoService.obterUsuarioLogado();
        return repository.findByUsuarioAndDataOrderByHoraAsc(usuario, data);
    }

    /**
     * Lista agendamentos do usuário em um intervalo de datas.
     * Usado para exibir a agenda da semana.
     *
     * @param inicio data inicial.
     * @param fim    data final.
     */
    public List<Agendamento> listarPorPeriodo(LocalDate inicio, LocalDate fim) {
        Usuario usuario = usuarioAutenticadoService.obterUsuarioLogado();
        return repository.findByUsuarioAndDataBetweenOrderByDataAscHoraAsc(usuario, inicio, fim);
    }

    /**
     * Cria um novo agendamento para o usuário autenticado.
     *
     * @param agendamento dados do agendamento.
     * @return agendamento salvo.
     */
    public Agendamento salvar(Agendamento agendamento) {
        Usuario usuario = usuarioAutenticadoService.obterUsuarioLogado();

        // Vincula o agendamento ao usuário logado
        agendamento.setUsuario(usuario);

        Agendamento salvo = repository.save(agendamento);
        log.info("Agendamento criado: id={} usuario={}", salvo.getId(), usuario.getEmail());
        return salvo;
    }

    /**
     * Atualiza um agendamento existente.
     * Garante que o agendamento pertence ao usuário autenticado.
     *
     * @param id   identificador do agendamento.
     * @param novo novos dados.
     * @return agendamento atualizado.
     */
    public Agendamento atualizar(Long id, Agendamento novo) {
        Agendamento agendamento = buscarDoUsuario(id);
        agendamento.atualizarDados(novo);
        return repository.save(agendamento);
    }

    /**
     * Remove um agendamento.
     * Garante que o agendamento pertence ao usuário autenticado.
     *
     * @param id identificador do agendamento.
     */
    public void deletar(Long id) {
        Agendamento agendamento = buscarDoUsuario(id);
        repository.delete(agendamento);
        log.info("Agendamento removido: id={}", id);
    }

    /**
     * Busca um agendamento garantindo que ele pertença ao usuário autenticado.
     * Lança exceção se não encontrar ou se pertencer a outro usuário.
     *
     * @param id identificador do agendamento.
     * @return agendamento encontrado.
     */
    private Agendamento buscarDoUsuario(Long id) {
        Usuario usuario = usuarioAutenticadoService.obterUsuarioLogado();

        Agendamento agendamento = repository.findById(id)
                .orElseThrow(() -> new AgendamentoNaoEncontradoException(id));

        // Impede acesso a agendamentos de outro usuário
        if (!agendamento.getUsuario().getId().equals(usuario.getId())) {
            throw new AcessoNegadoException();
        }

        return agendamento;
    }
}