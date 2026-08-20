"use client";

import { useMemo, useState } from "react";

type TabKey = "dashboard" | "patients" | "payments";
type PaymentStatus = "Pago" | "Atrasado";

type PaymentEntry = {
  name: string;
  phone: string;
  pending: number;
  status: PaymentStatus;
};

const overviewCards = [
  { title: "Pacientes Ativos", value: "18", hint: "Sob sua responsabilidade" },
  { title: "Sessões Este Mês", value: "42", hint: "Realizadas ou agendadas" },
  { title: "Hoje", value: "4 sessões", hint: "Próximo atendimento às 14:00" },
];

const nextSessions = [
  { patient: "Carlos Silva", date: "18/08/2026", time: "14:00" },
  { patient: "Mariana Costa", date: "18/08/2026", time: "15:30" },
  { patient: "João Pereira", date: "19/08/2026", time: "09:00" },
  { patient: "Beatriz Lima", date: "19/08/2026", time: "17:15" },
];

const patients = [
  {
    name: "Carla Mendes",
    age: 31,
    session: "Quarta, 15:30",
    status: "Em dia",
    payment: "Pago",
  },
  {
    name: "Rafael Nogueira",
    age: 29,
    session: "Terça, 11:00",
    status: "Em acompanhamento",
    payment: "Atrasado",
  },
  {
    name: "Larissa Costa",
    age: 42,
    session: "Sexta, 10:00",
    status: "Ativa",
    payment: "Pago",
  },
  {
    name: "Mateus Ribeiro",
    age: 35,
    session: "Segunda, 16:45",
    status: "Novo paciente",
    payment: "Pendente",
  },
];

const paymentEntries: PaymentEntry[] = [
  { name: "Carlos Silva", phone: "5511999999999", pending: 600, status: "Pago" },
  { name: "Roberto Souza", phone: "5581988887777", pending: 600, status: "Atrasado" },
  { name: "Ana Júlia", phone: "5581999996666", pending: 150, status: "Atrasado" },
  { name: "Daniel Almeida", phone: "5511987654321", pending: 320, status: "Pago" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [selectedDebtor, setSelectedDebtor] = useState<PaymentEntry | null>(null);

  const overdueCount = useMemo(
    () => paymentEntries.filter((entry) => entry.status === "Atrasado").length,
    [],
  );

  const totalCollected = useMemo(
    () =>
      paymentEntries
        .filter((entry) => entry.status === "Pago")
        .reduce((sum, entry) => sum + entry.pending, 0),
    [],
  );

  const handleOpenModal = (entry: PaymentEntry) => {
    setSelectedDebtor(entry);
  };

  const handleCloseModal = () => setSelectedDebtor(null);

  const handlePayment = () => {
    if (!selectedDebtor) return;

    const tag = "SUA_TAG_AQUI";
    const valor = selectedDebtor.pending.toFixed(2);
    const checkoutUrl = `https://infinitepay.io/${tag}?amount=${valor}`;
    const formattedPhone = selectedDebtor.phone.replace(/\D/g, "");
    const whatsappMessage = `Olá ${selectedDebtor.name}, tudo bem? Segue o link da InfinitePay para o acerto da nossa sessão pendente no valor de ${formatCurrency(selectedDebtor.pending)}: ${checkoutUrl}`;
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsappMessage)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    handleCloseModal();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <aside className="fixed left-0 top-0 h-screen w-60 bg-slate-800 px-5 py-7 text-white shadow-xl">
        <h2 className="mb-8 text-2xl font-bold tracking-tight text-sky-200">PsiManager</h2>

        {[
          { key: "dashboard", label: "📊 Painel Geral" },
          { key: "patients", label: "👥 Meus Pacientes" },
          { key: "payments", label: "💰 Pagamentos" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveTab(item.key as TabKey)}
            className={`mb-3 flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
              activeTab === item.key
                ? "bg-sky-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </aside>

      <main className="ml-60 flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Olá, Dr. Leonardo</h1>
          <p className="mt-1 text-sm text-slate-500">
            {activeTab === "dashboard"
              ? "Controle o fluxo de caixa e acompanhe as próximas sessões."
              : activeTab === "patients"
                ? "Gerencie seu quadro de pacientes e acompanhamento psicológico."
                : "Acompanhe pagamentos pendentes e envie cobranças em segundos."}
          </p>
        </div>

        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <section className="grid gap-5 md:grid-cols-3">
              {overviewCards.map((card) => (
                <div key={card.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">{card.title}</p>
                  <p className="mt-3 text-3xl font-bold text-slate-900">{card.value}</p>
                  <p className="mt-1 text-xs text-slate-400">{card.hint}</p>
                </div>
              ))}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Próximas Sessões da Semana</h2>

              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">Paciente</th>
                      <th className="px-4 py-3 font-medium">Data</th>
                      <th className="px-4 py-3 font-medium">Horário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nextSessions.map((session) => (
                      <tr key={`${session.patient}-${session.date}`} className="border-t border-slate-200">
                        <td className="px-4 py-3 text-slate-800">{session.patient}</td>
                        <td className="px-4 py-3 text-slate-600">{session.date}</td>
                        <td className="px-4 py-3 text-slate-600">{session.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === "patients" && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Seus Pacientes Ativos</h2>
                <p className="mt-1 text-sm text-slate-500">Gerencie aqui o grupo de pacientes vinculados ao seu perfil.</p>
              </div>
              <button type="button" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                + Novo paciente
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {patients.map((patient) => (
                <div key={patient.name} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{patient.name}</h3>
                      <p className="text-sm text-slate-500">{patient.age} anos</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        patient.payment === "Pago"
                          ? "bg-emerald-100 text-emerald-700"
                          : patient.payment === "Atrasado"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {patient.payment}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600">
                    <p>
                      <span className="font-medium text-slate-700">Status:</span> {patient.status}
                    </p>
                    <p>
                      <span className="font-medium text-slate-700">Próxima sessão:</span> {patient.session}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "payments" && (
          <div className="space-y-6">
            <section className="grid gap-5 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                <p className="text-sm font-medium text-emerald-700">Recebido (Mês)</p>
                <p className="mt-3 text-3xl font-bold text-emerald-700">{formatCurrency(totalCollected)}</p>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
                <p className="text-sm font-medium text-rose-700">Atrasados</p>
                <p className="mt-3 text-3xl font-bold text-rose-700">{overdueCount} Pacientes</p>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">
                Histórico de Cobrança
                <span className="ml-2 text-xs font-medium text-slate-500">(Clique em uma linha vermelha para cobrar)</span>
              </h2>

              <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">Paciente</th>
                      <th className="px-4 py-3 font-medium">Contato (WhatsApp)</th>
                      <th className="px-4 py-3 font-medium">Valor Pendente</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentEntries.map((entry) => {
                      const isLate = entry.status === "Atrasado";

                      return (
                        <tr
                          key={entry.name}
                          onClick={() => isLate && handleOpenModal(entry)}
                          className={`cursor-pointer transition ${
                            isLate ? "bg-rose-50 hover:bg-rose-100" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-slate-800">{isLate ? <strong>{entry.name}</strong> : entry.name}</td>
                          <td className="px-4 py-3 text-slate-600">{entry.phone}</td>
                          <td className={`px-4 py-3 font-semibold ${isLate ? "text-rose-600" : "text-slate-700"}`}>
                            {formatCurrency(entry.pending)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                entry.status === "Pago"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "animate-pulse bg-rose-100 text-rose-700"
                              }`}
                            >
                              {entry.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 transition-opacity duration-200 ${
          selectedDebtor ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div
          className={`w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-transform duration-200 ${
            selectedDebtor ? "translate-y-0" : "translate-y-4"
          }`}
        >
          <h2 className="mb-4 text-2xl font-bold text-slate-900">Gerar Cobrança InfinitePay</h2>

          <div className="space-y-3 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-800">Paciente:</span> {selectedDebtor?.name}
            </p>
            <p>
              <span className="font-semibold text-slate-800">Valor:</span> {selectedDebtor ? formatCurrency(selectedDebtor.pending) : ""}
            </p>
            <p className="text-xs text-slate-400">
              Enviado à API como <span className="font-semibold text-slate-500">{selectedDebtor ? Math.round(selectedDebtor.pending * 100) : 0}</span> centavos
            </p>
          </div>

          <button
            type="button"
            onClick={handlePayment}
            className="mt-6 w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            ⚡ Gerar Checkout InfinitePay e Notificar
          </button>

          <button
            type="button"
            onClick={handleCloseModal}
            className="mt-3 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
