/**
 * Camada de compatibilidade com a API do tRPC usada nas páginas originais.
 * Cada caminho (ex.: community.memberDashboard) é despachado para uma
 * função de servidor única, que roda as consultas no banco.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { rpc } from "./rpc.functions";

async function localAuthCall(path: string, input: any) {
  if (path === "auth.login") {
    const { error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (error) throw new Error(traduzErro(error.message));
    return rpc({ data: { path: "auth.ensure", input: {} } });
  }
  if (path === "auth.register") {
    // Não existe cadastro público: a conta só é criada/ativada após o pagamento
    // confirmado (billing.activate valida a sessão do Stripe no servidor).
    throw new Error("A criação de conta acontece somente após a confirmação do pagamento.");
  }
  if (path === "auth.resetPassword") {
    const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
      redirectTo: `${window.location.origin}/nova-senha`,
    });
    if (error) throw new Error(traduzErro(error.message));
    return { success: true };
  }
  if (path === "auth.updatePassword") {
    const { error } = await supabase.auth.updateUser({ password: input.password });
    if (error) throw new Error(traduzErro(error.message));
    return { success: true };
  }
  if (path === "auth.logout") {
    await supabase.auth.signOut();
    return { success: true };
  }
  return undefined;
}

function traduzErro(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (normalized.includes("already registered") || normalized.includes("already been registered"))
    return "Já existe uma conta com este e-mail.";
  if (normalized.includes("password")) return "A senha precisa ter pelo menos 8 caracteres.";
  if (normalized.includes("email")) return "Informe um e-mail válido.";
  return message;
}

export async function call(path: string, input?: unknown) {
  if (path.startsWith("auth.") && typeof window !== "undefined") {
    const handled = await localAuthCall(path, input ?? {});
    if (handled !== undefined) return handled;
  }
  return rpc({ data: { path, input: input ?? null } });
}

function utilsProxy(queryClient: QueryClient, parts: string[]): any {
  return new Proxy(
    {},
    {
      get(_target, key: string) {
        const path = parts.join(".");
        if (key === "invalidate")
          return (input?: unknown) =>
            queryClient.invalidateQueries({
              queryKey: input === undefined ? [path] : [path, input],
            });
        if (key === "setData")
          return (input: unknown, data: unknown) =>
            queryClient.setQueryData([path, input ?? null], data);
        if (key === "fetch")
          return (input?: unknown) =>
            queryClient.fetchQuery({
              queryKey: [path, input ?? null],
              queryFn: () => call(path, input),
            });
        if (key === "cancel") return () => queryClient.cancelQueries({ queryKey: [path] });
        if (key === "reset") return () => queryClient.resetQueries({ queryKey: [path] });
        return utilsProxy(queryClient, [...parts, key]);
      },
    },
  );
}

function createProxy(parts: string[]): any {
  return new Proxy(
    {},
    {
      get(_target, key: string) {
        const path = parts.join(".");
        if (key === "useUtils" || key === "useContext") {
          return () => {
            const queryClient = useQueryClient();
            return utilsProxy(queryClient, []);
          };
        }
        if (key === "useQuery") {
          return (input?: unknown, options?: Record<string, unknown>) =>
            useQuery({
              queryKey: [path, input ?? null],
              queryFn: () => call(path, input),
              retry: false,
              ...options,
            });
        }
        if (key === "useMutation") {
          return (options?: Record<string, unknown>) =>
            useMutation({
              mutationFn: (input: unknown) => call(path, input),
              ...options,
            });
        }
        return createProxy([...parts, key]);
      },
    },
  );
}

export const trpc: any = createProxy([]);
