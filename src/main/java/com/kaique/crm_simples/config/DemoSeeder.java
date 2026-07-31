package com.kaique.crm_simples.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kaique.crm_simples.dto.AgendamentoRequest;
import com.kaique.crm_simples.dto.ClienteRequest;
import com.kaique.crm_simples.dto.ClienteResponse;
import com.kaique.crm_simples.dto.ConfiguracaoUsuarioRequest;
import com.kaique.crm_simples.model.StatusLead;
import com.kaique.crm_simples.model.Usuario;
import com.kaique.crm_simples.model.enums.LocalAtendimento;
import com.kaique.crm_simples.model.enums.TipoAtendimento;
import com.kaique.crm_simples.repository.UsuarioRepository;
import com.kaique.crm_simples.service.AgendamentoService;
import com.kaique.crm_simples.service.ClienteService;
import com.kaique.crm_simples.service.ConfiguracaoUsuarioService;
import com.kaique.crm_simples.service.UsuarioService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Popula uma conta demo (Sprint 16.1) para apresentação da aplicação.
 *
 * Desligado por padrão ({@code app.demo.seed.enabled=false}) — só roda
 * quando explicitamente habilitado via variável de ambiente
 * {@code DEMO_SEED_ENABLED=true}, e só se o e-mail demo ainda não existir
 * (idempotente: seguro rodar em todo restart, nunca duplica dados).
 *
 * Não duplica nenhuma regra de negócio: reaproveita os mesmos services que
 * a API real usa (UsuarioService, ConfiguracaoUsuarioService, ClienteService,
 * AgendamentoService) — mesmas validações, mesma criptografia de senha,
 * mesmo cálculo de onboarding/local de atendimento que um cadastro real.
 *
 * ClienteService/AgendamentoService/ConfiguracaoUsuarioService resolvem o
 * dono via UsuarioAutenticadoService, que lê o usuário autenticado do
 * SecurityContextHolder — populado hoje só pelo JwtFilter a partir de um
 * token real. Como este seeder roda no startup (sem requisição HTTP), ele
 * monta o mesmo tipo de Authentication que o JwtFilter cria (ver
 * JwtFilter.doFilterInternal), só para o dono desses registros ser
 * resolvido corretamente — nenhum atalho novo, é o mecanismo padrão do
 * Spring Security para código que precisa agir como um usuário fora de uma
 * requisição.
 */
@Component
public class DemoSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoSeeder.class);

    private static final String DEMO_NOME = "João da Silva";
    private static final String DEMO_EMAIL = "demo@orbiscrm.com";
    private static final String DEMO_SENHA = "Orbis123";

    private final boolean habilitado;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;
    private final ConfiguracaoUsuarioService configuracaoUsuarioService;
    private final ClienteService clienteService;
    private final AgendamentoService agendamentoService;
    private final Clock clock;
    private final ObjectMapper objectMapper;

    public DemoSeeder(
            @Value("${app.demo.seed.enabled:false}") boolean habilitado,
            UsuarioRepository usuarioRepository,
            UsuarioService usuarioService,
            ConfiguracaoUsuarioService configuracaoUsuarioService,
            ClienteService clienteService,
            AgendamentoService agendamentoService,
            Clock clock,
            ObjectMapper objectMapper) {
        this.habilitado = habilitado;
        this.usuarioRepository = usuarioRepository;
        this.usuarioService = usuarioService;
        this.configuracaoUsuarioService = configuracaoUsuarioService;
        this.clienteService = clienteService;
        this.agendamentoService = agendamentoService;
        this.clock = clock;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!habilitado) {
            return;
        }
        if (usuarioRepository.findByEmail(DEMO_EMAIL).isPresent()) {
            log.info("Conta demo ({}) já existe — seed ignorado.", DEMO_EMAIL);
            return;
        }

        log.info("Criando conta demo ({})...", DEMO_EMAIL);
        try {
            criarContaDemo();
            log.info("Conta demo criada com sucesso.");
        } catch (Exception e) {
            // Falha no seed não pode derrubar a aplicação — é um recurso de
            // apresentação, não uma dependência funcional do sistema.
            log.error("Falha ao criar conta demo — a aplicação continua normalmente.", e);
        }
    }

    private void criarContaDemo() throws Exception {
        // Usuario.senha só aceita valor via desserialização JSON (WRITE_ONLY,
        // sem setter público — ver Usuario.java) — o mesmo caminho que
        // UsuarioController.cadastrar() usa para @RequestBody Usuario.
        Usuario usuario = objectMapper.readValue(
                """
                {"nome": "%s", "email": "%s", "senha": "%s"}
                """.formatted(DEMO_NOME, DEMO_EMAIL, DEMO_SENHA),
                Usuario.class);
        usuarioService.salvar(usuario);

        autenticarComo(DEMO_EMAIL);
        try {
            ConfiguracaoUsuarioRequest configuracao = new ConfiguracaoUsuarioRequest();
            configuracao.setTipoAtendimento(TipoAtendimento.AMBOS);
            configuracaoUsuarioService.salvar(configuracao);

            Map<String, Long> clientePorNome = criarClientes();
            criarAgendamentos(clientePorNome);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    /** Mesmo tipo de Authentication que o JwtFilter cria a partir de um JWT válido. */
    private void autenticarComo(String email) {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(email, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private record ClienteSeed(String nome, String telefone, String email, String observacoes, StatusLead status) {}

    private Map<String, Long> criarClientes() {
        List<ClienteSeed> seeds = List.of(
                new ClienteSeed(
                        "Maria Aparecida Souza", "11987654321", "maria.souza@example.com",
                        "Chegou pelo Instagram, ainda não retornamos o contato.", StatusLead.NOVO),
                new ClienteSeed(
                        "Carlos Eduardo Lima", "11976543210", "carlos.lima@example.com",
                        "Já conversamos por WhatsApp, aguardando ele confirmar disponibilidade.", StatusLead.CONTATADO),
                new ClienteSeed(
                        "Fernanda Ribeiro", "11965432109", "fernanda.ribeiro@example.com",
                        "Negociando um pacote mensal de manutenção.", StatusLead.NEGOCIACAO),
                new ClienteSeed(
                        "Roberto Alves", "11954321098", "roberto.alves@example.com",
                        "Orçamento enviado, aguardando aprovação.", StatusLead.PROPOSTA),
                new ClienteSeed(
                        "Juliana Costa", "11943210987", "juliana.costa@example.com",
                        "Cliente fechado — atendimento recorrente todo mês.", StatusLead.GANHO));

        Map<String, Long> ids = new LinkedHashMap<>();
        for (ClienteSeed seed : seeds) {
            ClienteRequest request = new ClienteRequest();
            request.setNome(seed.nome());
            request.setTelefone(seed.telefone());
            request.setEmail(seed.email());
            request.setObservacoes(seed.observacoes());
            request.setStatusLead(seed.status());

            ClienteResponse salvo = clienteService.salvar(request);
            ids.put(seed.nome(), salvo.id());
        }
        return ids;
    }

    private record AgendamentoSeed(
            String titulo, String clienteNome, LocalDate data, LocalTime hora,
            String categoria, LocalAtendimento local) {}

    private void criarAgendamentos(Map<String, Long> clientePorNome) {
        LocalDate hoje = LocalDate.now(clock);

        List<AgendamentoSeed> seeds = List.of(
                new AgendamentoSeed(
                        "Atendimento inicial", "Maria Aparecida Souza",
                        hoje, LocalTime.of(9, 0), "atendimento", LocalAtendimento.ESTABELECIMENTO),
                new AgendamentoSeed(
                        "Visita técnica", "Carlos Eduardo Lima",
                        hoje, LocalTime.of(14, 30), "atendimento", LocalAtendimento.EXTERNO),
                new AgendamentoSeed(
                        "Reunião de negociação", "Fernanda Ribeiro",
                        hoje.plusDays(1), LocalTime.of(10, 0), "reuniao", LocalAtendimento.ESTABELECIMENTO),
                new AgendamentoSeed(
                        "Entrega de orçamento", "Roberto Alves",
                        hoje.plusDays(2), LocalTime.of(11, 0), "orcamento", LocalAtendimento.EXTERNO),
                new AgendamentoSeed(
                        "Retorno mensal", "Juliana Costa",
                        hoje.plusDays(3), LocalTime.of(15, 0), "retorno", LocalAtendimento.ESTABELECIMENTO));

        for (AgendamentoSeed seed : seeds) {
            AgendamentoRequest request = new AgendamentoRequest();
            request.setTitulo(seed.titulo());
            request.setPessoa(seed.clienteNome());
            request.setClienteId(clientePorNome.get(seed.clienteNome()));
            request.setData(seed.data());
            request.setHora(seed.hora());
            request.setCategoria(seed.categoria());
            request.setLembrete(0);
            request.setLocalAtendimento(seed.local());

            agendamentoService.salvar(request);
        }
    }
}
