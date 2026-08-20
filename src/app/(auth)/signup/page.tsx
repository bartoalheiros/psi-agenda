"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    specialty: "Psicoterapia individual",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Não foi possível criar o cadastro.");
      }

      router.push("/");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-600">PsiManager</p>
        <h1 className="text-3xl font-bold text-slate-900">Criar conta</h1>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nome</label>
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sky-500"
            placeholder="Seu nome completo"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sky-500"
            placeholder="seu@email.com"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Especialidade</label>
          <input
            value={form.specialty}
            onChange={(event) => setForm({ ...form, specialty: event.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sky-500"
            placeholder="Psicoterapiaindividual"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Telefone</label>
          <input
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sky-500"
            placeholder="(11) 99999-9999"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Senha</label>
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sky-500"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Criando conta..." : "Criar conta"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Já tem uma conta?{" "}
        <a href="/signin" className="font-medium text-sky-600 hover:text-sky-700">
          Entrar
        </a>
      </p>
    </form>
  );
}
