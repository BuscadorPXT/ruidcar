import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  config?: RequestInit
): Promise<Response> {
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    ...config
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Reativa para melhor UX
      staleTime: 5 * 60 * 1000, // 5 minutos (era Infinity)
      gcTime: 10 * 60 * 1000, // 10 minutos para garbage collection
      retry: (failureCount, error: any) => {
        // Não retry em erros 4xx (cliente)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry até 2 vezes para erros de rede/servidor
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Não retry mutações por segurança
        return false;
      },
    },
  },
});

// Configurações específicas por tipo de query
export const getQueryOptions = {
  // Dados que mudam frequentemente (leads, notificações)
  realTime: {
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // 1 minuto em background
  },

  // Dados que mudam moderadamente (workshops, usuários)
  moderate: {
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
  },

  // Dados relativamente estáticos (configurações, constantes)
  static: {
    staleTime: 30 * 60 * 1000, // 30 minutos
    refetchOnWindowFocus: false,
    gcTime: 60 * 60 * 1000, // 1 hora
  },

  // Dados de autenticação (cache mais agressivo)
  auth: {
    staleTime: 15 * 60 * 1000, // 15 minutos
    refetchOnWindowFocus: true,
    retry: 1, // Retry apenas 1 vez
  }
};
