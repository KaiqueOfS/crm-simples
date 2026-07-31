package com.kaique.crm_simples.service;

import com.kaique.crm_simples.dto.ConfiguracaoUsuarioRequest;
import com.kaique.crm_simples.dto.ConfiguracaoUsuarioResponse;
import com.kaique.crm_simples.model.ConfiguracaoUsuario;
import com.kaique.crm_simples.model.Usuario;
import com.kaique.crm_simples.model.enums.TipoAtendimento;
import com.kaique.crm_simples.repository.ConfiguracaoUsuarioRepository;
import com.kaique.crm_simples.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Serviço responsável pela configuração de negócio do usuário (Sprint 14).
 *
 * Mesmo padrão de dono usado em ClienteService/AgendamentoService: o
 * usuário nunca vem do request, sempre do usuário autenticado.
 */
@Service
public class ConfiguracaoUsuarioService {

    private static final Logger log = LoggerFactory.getLogger(ConfiguracaoUsuarioService.class);

    private final ConfiguracaoUsuarioRepository repository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioAutenticadoService usuarioAutenticadoService;

    public ConfiguracaoUsuarioService(
            ConfiguracaoUsuarioRepository repository,
            UsuarioRepository usuarioRepository,
            UsuarioAutenticadoService usuarioAutenticadoService) {
        this.repository = repository;
        this.usuarioRepository = usuarioRepository;
        this.usuarioAutenticadoService = usuarioAutenticadoService;
    }

    /**
     * Busca a configuração do usuário autenticado.
     * Retorna uma resposta "vazia" (tipoAtendimento null) quando o
     * usuário ainda não concluiu a configuração inicial — não é um erro.
     */
    public ConfiguracaoUsuarioResponse buscar() {
        Usuario usuario = usuarioAutenticadoService.obterUsuarioLogado();

        return repository.findByUsuario(usuario)
                .map(ConfiguracaoUsuarioResponse::de)
                .orElseGet(ConfiguracaoUsuarioResponse::vazia);
    }

    /**
     * Tipo de atendimento configurado pelo usuário (Sprint 15.1) — usado
     * pelo AgendamentoService para decidir o local de cada compromisso.
     * Retorna null quando o usuário ainda não tem configuração salva.
     */
    public TipoAtendimento obterTipoAtendimento(Usuario usuario) {
        return repository.findByUsuario(usuario)
                .map(ConfiguracaoUsuario::getTipoAtendimento)
                .orElse(null);
    }

    /**
     * Salva a configuração inicial do usuário autenticado.
     *
     * Idempotente: se o usuário já tem uma configuração (ex.: refez o
     * onboarding), atualiza em vez de criar uma segunda linha — a
     * relação é 1:1 (ver uk_configuracoes_usuario_usuario).
     *
     * Marca o usuário como tendo concluído o onboarding na primeira vez.
     */
    public ConfiguracaoUsuarioResponse salvar(ConfiguracaoUsuarioRequest request) {
        Usuario usuario = usuarioAutenticadoService.obterUsuarioLogado();

        ConfiguracaoUsuario configuracao = repository.findByUsuario(usuario)
                .orElseGet(() -> {
                    ConfiguracaoUsuario nova = new ConfiguracaoUsuario();
                    nova.setUsuario(usuario);
                    return nova;
                });

        configuracao.setTipoAtendimento(request.getTipoAtendimento());
        ConfiguracaoUsuario salva = repository.save(configuracao);

        if (!usuario.isOnboardingConcluido()) {
            usuario.setOnboardingConcluido(true);
            usuarioRepository.save(usuario);
        }

        log.info("Configuração inicial salva: usuario={} tipoAtendimento={}", usuario.getEmail(), request.getTipoAtendimento());
        return ConfiguracaoUsuarioResponse.de(salva);
    }
}
