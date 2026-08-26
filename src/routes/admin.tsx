import { useState } from "react";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel administrativo" },
      { name: "description", content: "Crie, edite e publique as postagens do blog." },
      { property: "og:title", content: "Painel administrativo" },
      { property: "og:description", content: "Gerencie as postagens publicadas no blog." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="mx-auto max-w-5xl px-6 py-16 text-sm text-muted-foreground">Carregando…</div>;
  }

  if (!user) return <AuthCard />;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-2xl font-semibold">Acesso restrito</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sua conta não tem permissão de administrador.
        </p>
        <Button className="mt-6" variant="outline" onClick={() => void supabase.auth.signOut()}>
          Sair
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-surface">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Link to="/admin" className="text-sm font-semibold">
            Painel do blog
          </Link>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="hidden sm:inline">{user.email}</span>
            <Button size="sm" variant="outline" onClick={() => void supabase.auth.signOut()}>
              Sair
            </Button>
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  );
}

function AuthCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Bem-vindo de volta!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível autenticar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold">Painel administrativo</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Entre para gerenciar as postagens.
      </p>

      <form
        onSubmit={submit}
        className="mt-8 flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-soft"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" disabled={busy}>
          Entrar
        </Button>
      </form>
    </div>
  );
}
