// Em produção o front-end é servido pelo próprio Spring Boot (mesma
// origem da API), então o padrão é usar caminho relativo (""). Em
// desenvolvimento (vite dev na porta 5173), aponta para o backend
// local na porta 8080. Pode ser sobrescrito via VITE_API_BASE_URL.
const BASE =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? "http://localhost:8080" : "");

const TOKEN_KEY = "orbis.jwt";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

/**
 * Disparado quando uma chamada autenticada recebe 401 (token ausente,
 * expirado ou inválido). A tela de clientes escuta esse evento para
 * limpar a sessão e redirecionar para o login, em vez de deixar o
 * usuário preso vendo erros repetidos.
 */
export const SESSION_EXPIRED_EVENT = "orbis:session-expired";

export async function api<T = unknown>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {

  const { auth = true, headers, ...rest } = init;

  const h = new Headers(headers);

  h.set("Content-Type", "application/json");

  if (auth) {
    const t = getToken();

    if (t) {
      h.set("Authorization", `Bearer ${t}`);
    }
  }

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...rest,
      headers: h,
    });
  } catch {
    // fetch só lança aqui por falha de rede/conexão (não por status HTTP de
    // erro, que cai no bloco abaixo) — a mensagem nativa do browser
    // ("Failed to fetch") é técnica e em inglês, não deve chegar ao usuário.
    throw new Error("Não foi possível conectar ao servidor. Verifique sua internet.");
  }

  if (!res.ok) {

    if (auth && res.status === 401) {
      clearToken();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    let msg = `${res.status} ${res.statusText}`;

    try {

      const body = await res.json();

      // O GlobalExceptionHandler do backend responde com { "erro": "..." }
      // (às vezes com um mapa de campo -> mensagem, no caso de validação).
      if (typeof body?.erro === "string") {
        msg = body.erro;
      } else if (typeof body?.message === "string") {
        msg = body.message;
      } else if (typeof body?.error === "string") {
        msg = body.error;
      } else if (body && typeof body === "object") {
        const primeiraMensagem = Object.values(body)[0];
        if (typeof primeiraMensagem === "string") {
          msg = primeiraMensagem;
        }
      }

    } catch {
      // corpo não veio como JSON, mantém a mensagem padrão
    }

    throw new Error(msg);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const ct = res.headers.get("content-type") ?? "";

  return (
    ct.includes("application/json")
      ? await res.json()
      : ((await res.text()) as unknown)
  ) as T;
}

export type Status =
  | "NOVO"
  | "CONTATADO"
  | "NEGOCIACAO"
  | "PROPOSTA"
  | "GANHO"
  | "PERDIDO";

export const STATUS_LIST: Status[] = [
  "NOVO",
  "CONTATADO",
  "NEGOCIACAO",
  "PROPOSTA",
  "GANHO",
  "PERDIDO",
];

// "statusLead" (não "status") — o backend expõe esse campo com esse nome
// (ClienteResponse.statusLead / ClienteRequest.statusLead); o único endpoint
// que usa a chave "status" é o dedicado PUT /api/clientes/{id}/status
// (StatusLeadRequest), tratado à parte por `clientesApi.updateStatus`.
export type Cliente = {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  observacoes: string;
  statusLead: Status;
  createdAt: string;
  updatedAt: string;
};

// "createdAt"/"updatedAt" são só leitura (vêm do backend) — nunca fazem
// parte do que a tela de clientes envia ao criar/atualizar.
export type ClienteInput = Omit<Cliente, "id" | "createdAt" | "updatedAt">;

export type Pagina<T> = {
  conteudo: T[];
  pagina: number;
  tamanho: number;
  totalElementos: number;
  totalPaginas: number;
};

export type Dashboard = {
  totalClientes: number;
  novos: number;
  contatados: number;
  negociacao: number;
  proposta: number;
  ganhos: number;
  perdidos: number;
};

export type CategoriaAgendamento =
  | "atendimento"
  | "retorno"
  | "orcamento"
  | "reuniao"
  | "urgente"
  | "outro";

export type StatusAgendamento = "PENDENTE" | "CONCLUIDO" | "CANCELADO";

// Onde este compromisso específico acontece (Sprint 15.1) — distinto de
// TipoAtendimento (capacidade da conta, ver ConfiguracaoUsuario). Vem null
// só em agendamentos criados antes desta sprint (V7 é nullable, sem backfill).
export type LocalAtendimento = "ESTABELECIMENTO" | "EXTERNO";

export type Agendamento = {
  id: number;
  titulo: string;
  pessoa: string;
  clienteId: number | null;
  data: string;
  hora: string;
  categoria: CategoriaAgendamento;
  lembrete: number;
  status: StatusAgendamento;
  localAtendimento: LocalAtendimento | null;
};

// "status" é opcional aqui: ausente na criação o backend usa PENDENTE, ausente
// na atualização ele mantém o status atual (ver AgendamentoService.java) — só
// o endpoint /concluir muda status de propósito.
// "localAtendimento" também é opcional: obrigatório apenas quando a conta é
// AMBOS (o backend valida — ver AgendamentoService.resolverLocalAtendimento);
// para NO_ESTABELECIMENTO/EXTERNO o backend preenche sozinho e ignora o que
// vier aqui.
export type AgendamentoInput = Omit<Agendamento, "id" | "status" | "localAtendimento"> & {
  status?: StatusAgendamento;
  localAtendimento?: LocalAtendimento;
};

// "disponivel" sempre false por enquanto — Financeiro e Orçamentos ainda não
// existem como módulos; o backend já responde nesse formato para o dia em
// que existirem, sem o frontend precisar mudar o contrato.
export type ModuloStatus = {
  disponivel: boolean;
};

// Painel agregado de GET /api/meu-dia (ver MeuDiaResponse no backend) — toda
// a lógica de próximo/pendentes/concluídos/atrasados é calculada lá, não aqui.
export type MeuDia = {
  proximoCompromisso: Agendamento | null;
  compromissosHoje: Agendamento[];
  totalPendentes: number;
  totalConcluidos: number;
  totalAtrasados: number;
  financeiro: ModuloStatus;
  orcamentos: ModuloStatus;
};

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  onboardingConcluido: boolean;
};

export type TipoAtendimento = "NO_ESTABELECIMENTO" | "EXTERNO" | "AMBOS";

export type ConfiguracaoUsuario = {
  id: number | null;
  tipoAtendimento: TipoAtendimento | null;
  segmentoNegocio: string | null;
  enderecoEstabelecimento: string | null;
};

export const authApi = {

  login: (email: string, senha: string) =>
    api<{ token: string }>("/api/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email, senha }),
    }),

  cadastrar: (nome: string, email: string, senha: string, confirmarSenha: string) =>
    api<{ id: number; nome: string; email: string }>("/api/usuarios", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ nome, email, senha, confirmarSenha }),
    }),

};

export const clientesApi = {

  list: ({ pagina = 0, tamanho = 20, termo, status }: {
    pagina?: number;
    tamanho?: number;
    termo?: string;
    status?: Status;
  } = {}) => {
    const parametros = new URLSearchParams({ pagina: String(pagina), tamanho: String(tamanho) });
    if (termo?.trim()) parametros.set("termo", termo.trim());
    if (status) parametros.set("status", status);
    return api<Pagina<Cliente>>(`/api/clientes?${parametros.toString()}`);
  },

  get: (id: number) => api<Cliente>(`/api/clientes/${id}`),

  create: (c: ClienteInput) =>
    api<Cliente>("/api/clientes", {
      method: "POST",
      body: JSON.stringify(c),
    }),

  update: (id: number, c: ClienteInput) =>
    api<Cliente>(`/api/clientes/${id}`, {
      method: "PUT",
      body: JSON.stringify(c),
    }),

  updateStatus: (id: number, status: Status) =>
    api<Cliente>(`/api/clientes/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  remove: (id: number) =>
    api<void>(`/api/clientes/${id}`, {
      method: "DELETE",
    }),

};

export const dashboardApi = {
  get: () => api<Dashboard>("/api/dashboard"),
};

export const meuDiaApi = {
  get: () => api<MeuDia>("/api/meu-dia"),
};

export const agendamentosApi = {
  list: (data?: string) =>
    api<Agendamento[]>(`/api/agendamentos${data ? `?data=${encodeURIComponent(data)}` : ""}`),

  listarPorCliente: (clienteId: number) =>
    api<Agendamento[]>(`/api/agendamentos/cliente/${clienteId}`),

  listarHistorico: (clienteId: number) =>
    api<Agendamento[]>(`/api/agendamentos/cliente/${clienteId}/historico`),

  create: (agendamento: AgendamentoInput) =>
    api<Agendamento>("/api/agendamentos", {
      method: "POST",
      body: JSON.stringify(agendamento),
    }),

  update: (id: number, agendamento: AgendamentoInput) =>
    api<Agendamento>(`/api/agendamentos/${id}`, {
      method: "PUT",
      body: JSON.stringify(agendamento),
    }),

  remove: (id: number) =>
    api<void>(`/api/agendamentos/${id}`, {
      method: "DELETE",
    }),

  concluir: (id: number) =>
    api<Agendamento>(`/api/agendamentos/${id}/concluir`, {
      method: "PATCH",
    }),
};

export const usuariosApi = {
  perfil: () => api<Usuario>("/api/usuarios/perfil"),

  atualizarPerfil: (dados: { nome: string; novaSenha?: string; confirmarSenha?: string }) =>
    api<Usuario>("/api/usuarios/perfil", {
      method: "PUT",
      body: JSON.stringify(dados),
    }),
};

export const configuracaoUsuarioApi = {
  get: () => api<ConfiguracaoUsuario>("/api/configuracao-usuario"),

  salvar: (tipoAtendimento: TipoAtendimento) =>
    api<ConfiguracaoUsuario>("/api/configuracao-usuario", {
      method: "POST",
      body: JSON.stringify({ tipoAtendimento }),
    }),
};
