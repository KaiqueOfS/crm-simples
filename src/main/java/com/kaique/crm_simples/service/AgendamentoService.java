package com.kaique.crm_simples.service;

import com.kaique.crm_simples.dto.AgendamentoRequest;
import com.kaique.crm_simples.dto.AgendamentoResponse;
import com.kaique.crm_simples.exception.AcessoNegadoException;
import com.kaique.crm_simples.exception.AgendamentoNaoEncontradoException;
import com.kaique.crm_simples.exception.ClienteNaoEncontradoException;
import com.kaique.crm_simples.model.Agendamento;
import com.kaique.crm_simples.model.Cliente;
import com.kaique.crm_simples.model.Usuario;
import com.kaique.crm_simples.repository.AgendamentoRepository;
import com.kaique.crm_simples.repository.ClienteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Serviço responsável pelas regras de negócio dos agendamentos.
 *
 * Cada usuário só pode ver e editar seus próprios agendamentos.
 *
 * Fronteira DTO ↔ entidade: este service é o único lugar que converte
 * AgendamentoRequest em Agendamento e Agendamento em AgendamentoResponse.
 * O dono (usuario) nunca vem do request (ver docs/DTO-ARCHITECTURE.md).
 */
@Service
public class AgendamentoService {

    private static final Logger log = LoggerFactory.getLogger(AgendamentoService.class);

    private final AgendamentoRepository repository;
    private final ClienteRepository clienteRepository;
    private final UsuarioAutenticadoService usuarioAutenticadoService;

    public AgendamentoService(
            AgendamentoRepository repository,
            ClienteRepository clienteRepository,
            UsuarioAutenticadoService usuarioAutenticadoService) {
        this.repository = repository;
        this.clienteRepository = clienteRepository;
        this.usuarioAutenticadoService = usuarioAutenticadoService;
    }

    /**
     * Lista todos os agendamentos do usuário autenticado.
     * Ordenados por data e hora crescente.
     */
    public List<AgendamentoResponse> listarTodos() {
        Usuario usuario = usuarioAutenticadoService.obterUsuarioLogado();
        return repository.findByUsuarioOrderByDataAscHoraAsc(usuario).stream()
                .map(AgendamentoResponse::de)
                .toList();
    }

    /**
     * Lista agendamentos do usuário em uma data específica.
     * Usado para exibir a agenda do dia.
     */
    public List<AgendamentoResponse> listarPorData(LocalDate data) {
        Usuario usuario = usuarioAutenticadoService.obterUsuarioLogado();
        return repository.findByUsuarioAndDataOrderByHoraAsc(usuario, data).stream()
                .map(AgendamentoResponse::de)
                .toList();
    }

    /**
     * Lista agendamentos do usuário em um intervalo de datas.
     * Usado para exibir a agenda da semana.
     */
    public List<AgendamentoResponse> listarPorPeriodo(LocalDate inicio, LocalDate fim) {
        Usuario usuario = usuarioAutenticadoService.obterUsuarioLogado();
        return repository.findByUsuarioAndDataBetweenOrderByDataAscHoraAsc(usuario, inicio, fim).stream()
                .map(AgendamentoResponse::de)
                .toList();
    }

    /**
     * Lista os agendamentos de um cliente específico do usuário autenticado.
     * Base para a seção "Próximos compromissos" no painel de detalhes do
     * cliente (Fase 7.1). Não existe relação inversa Cliente → Agendamento;
     * a consulta é sempre feita por aqui, a partir do Agendamento.
     */
    public List<AgendamentoResponse> listarPorCliente(Long clienteId) {
        Usuario usuario = usuarioAutenticadoService.obterUsuarioLogado();
        Cliente cliente = buscarClienteDoUsuario(clienteId, usuario);
        return repository.findByUsuarioAndClienteOrderByDataAscHoraAsc(usuario, cliente).stream()
                .map(AgendamentoResponse::de)
                .toList();
    }

    /**
     * Cria um novo agendamento para o usuário autenticado.
     *
     * O request não tem campo "usuario" — o dono é sempre o usuário
     * autenticado, nunca algo vindo do corpo da requisição.
     */
    public AgendamentoResponse salvar(AgendamentoRequest request) {
        Usuario usuario = usuarioAutenticadoService.obterUsuarioLogado();

        Agendamento agendamento = new Agendamento();
        agendamento.setTitulo(request.getTitulo());
        agendamento.setData(request.getData());
        agendamento.setHora(request.getHora());
        agendamento.setCategoria(request.getCategoria());
        agendamento.setLembrete(request.getLembrete());
        agendamento.setUsuario(usuario);
        aplicarCliente(agendamento, request, usuario);

        Agendamento salvo = repository.save(agendamento);
        log.info("Agendamento criado: id={} usuario={}", salvo.getId(), usuario.getEmail());
        return AgendamentoResponse.de(salvo);
    }

    /**
     * Atualiza um agendamento existente.
     * Garante que o agendamento pertence ao usuário autenticado.
     */
    public AgendamentoResponse atualizar(Long id, AgendamentoRequest request) {
        Agendamento agendamento = buscarDoUsuario(id);
        agendamento.setTitulo(request.getTitulo());
        agendamento.setData(request.getData());
        agendamento.setHora(request.getHora());
        agendamento.setCategoria(request.getCategoria());
        agendamento.setLembrete(request.getLembrete());
        aplicarCliente(agendamento, request, agendamento.getUsuario());
        return AgendamentoResponse.de(repository.save(agendamento));
    }

    /**
     * Resolve e aplica o cliente vinculado ao agendamento, quando informado.
     *
     * Se "clienteId" vier no request, busca o Cliente garantindo que
     * pertence ao mesmo usuário do agendamento (mesma checagem de
     * ClienteService.buscarClienteDoUsuario) e sincroniza "pessoa" a partir
     * do nome dele. Sem "clienteId", mantém o comportamento anterior:
     * "pessoa" como texto livre, sem cliente vinculado.
     */
    private void aplicarCliente(Agendamento agendamento, AgendamentoRequest request, Usuario usuario) {
        if (request.getClienteId() == null) {
            agendamento.setCliente(null);
            agendamento.setPessoa(request.getPessoa());
            return;
        }

        Cliente cliente = buscarClienteDoUsuario(request.getClienteId(), usuario);
        agendamento.setCliente(cliente);
        agendamento.setPessoa(cliente.getNome());
    }

    /**
     * Busca um cliente garantindo que pertence ao usuário informado.
     * Mesma checagem de ClienteService.buscarClienteDoUsuario — reaproveitada
     * aqui tanto para vincular um cliente a um agendamento quanto para listar
     * os agendamentos de um cliente.
     */
    private Cliente buscarClienteDoUsuario(Long clienteId, Usuario usuario) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ClienteNaoEncontradoException(clienteId));

        if (!cliente.getUsuario().getId().equals(usuario.getId())) {
            throw new AcessoNegadoException();
        }

        return cliente;
    }

    /**
     * Remove um agendamento.
     * Garante que o agendamento pertence ao usuário autenticado.
     */
    public void deletar(Long id) {
        Agendamento agendamento = buscarDoUsuario(id);
        repository.delete(agendamento);
        log.info("Agendamento removido: id={}", id);
    }

    /**
     * Busca um agendamento garantindo que ele pertença ao usuário autenticado.
     * Lança exceção se não encontrar ou se pertencer a outro usuário.
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
