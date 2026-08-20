"use client";

import { useEffect, useMemo, useState } from "react";

type TabKey = "dashboard" | "psychologists" | "patients" | "sessions" | "payments";
type SessionStatus = "agendada" | "realizada" | "cancelada";

type Psychologist = {
  id: string;
  name: string;
  specialty: string;
  email: string;
  phone: string;
};

type Patient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  psychologistId: string;
  note: string;
};

type Session = {
  id: string;
  psychologistId: string;
  patientId: string;
  date: string;
  time: string;
  status: SessionStatus;
  value: number;
  paid: boolean;
};

type AppData = {
  psychologists: Psychologist[];
  patients: Patient[];
  sessions: Session[];
};

type PsychologistForm = {
  name: string;
  specialty: string;
  email: string;
  phone: string;
};

type PatientForm = {
  name: string;
  email: string;
  phone: string;
  psychologistId: string;
  note: string;
};

type SessionForm = {
  psychologistId: string;
  patientId: string;
  date: string;
  time: string;
  value: string;
  status: SessionStatus;
  paid: boolean;
};

const STORAGE_KEY = "psi-clinic-crud-v1";

const defaultPsychologists: Psychologist[] = [
  { id: "psy-1", name: "Dr. Leonardo Silva", specialty: "Psicoterapia Individual", email: "leonardo@psi.com", phone: "(11) 99999-1234" },
  { id: "psy-2", name: "Dra. Marina Costa", specialty: "Terapia de Casal", email: "marina@psi.com", phone: "(11) 98888-5678" },
];

const defaultPatients: Patient[] = [
  { id: "pat-1", name: "Carlos Silva", email: "carlos@gmail.com", phone: "(11) 97777-1111", psychologistId: "psy-1", note: "Ansiedade e rotina profissional" },
  { id: "pat-2", name: "Mariana Costa", email: "mariana@gmail.com", phone: "(11) 96666-2222", psychologistId: "psy-2", note: "Relacionamentos e comunicação" },
  { id: "pat-3", name: "Roberto Souza", email: "roberto@gmail.com", phone: "(81) 98888-7777", psychologistId: "psy-1", note: "Acompanhamento para estresse" },
  { id: "pat-4", name: "Ana Júlia", email: "ana@gmail.com", phone: "(81) 99999-6666", psychologistId: "psy-2", note: "Cuidados com bem-estar emocional" },
];

const defaultSessions: Session[] = [
  { id: "ses-1", psychologistId: "psy-1", patientId: "pat-1", date: "2026-08-25", time: "14:00", status: "agendada", value: 600, paid: false },
  { id: "ses-2", psychologistId: "psy-2", patientId: "pat-2", date: "2026-08-24", time: "15:30", status: "realizada", value: 500, paid: true },
  { id: "ses-3", psychologistId: "psy-1", patientId: "pat-3", date: "2026-08-22", time: "11:00", status: "agendada", value: 600, paid: false },
  { id: "ses-4", psychologistId: "psy-2", patientId: "pat-4", date: "2026-08-27", time: "10:00", status: "agendada", value: 150, paid: false },
];

const defaultData: AppData = {
  psychologists: defaultPsychologists,
  patients: defaultPatients,
  sessions: defaultSessions,
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));

const createId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;

const emptyPsychologistForm: PsychologistForm = {
  name: "",
  specialty: "",
  email: "",
  phone: "",
};

const emptyPatientForm = (psychologistId: string): PatientForm => ({
  name: "",
  email: "",
  phone: "",
  psychologistId,
  note: "",
});

const emptySessionForm = (psychologistId: string, patientId: string): SessionForm => ({
  psychologistId,
  patientId,
  date: new Date().toISOString().slice(0, 10),
  time: "09:00",
  value: "300",
  status: "agendada",
  paid: false,
});

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [data, setData] = useState<AppData>(defaultData);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState<{ id: string; name: string; phone: string; value: number } | null>(null);

  const [psychologistForm, setPsychologistForm] = useState<PsychologistForm>(emptyPsychologistForm);
  const [editingPsychologistId, setEditingPsychologistId] = useState<string | null>(null);

  const [patientForm, setPatientForm] = useState<PatientForm>(emptyPatientForm(defaultPsychologists[0]?.id ?? ""));
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);

  const [sessionForm, setSessionForm] = useState<SessionForm>(emptySessionForm(defaultPsychologists[0]?.id ?? "", defaultPatients[0]?.id ?? ""));
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppData;
        if (parsed.psychologists?.length && parsed.patients && parsed.sessions) {
          setData(parsed);
          const firstPsychologist = parsed.psychologists[0]?.id ?? "";
          const firstPatient = parsed.patients[0]?.id ?? "";
          setPatientForm(emptyPatientForm(firstPsychologist));
          setSessionForm(emptySessionForm(firstPsychologist, firstPatient));
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados locais", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, isLoaded]);

  useEffect(() => {
    if (!data.psychologists.length) {
      setPatientForm((form) => ({ ...form, psychologistId: "" }));
      setSessionForm((form) => ({ ...form, psychologistId: "" }));
      return;
    }

    if (!data.psychologists.some((item) => item.id === patientForm.psychologistId)) {
      setPatientForm((form) => ({ ...form, psychologistId: data.psychologists[0].id }));
    }

    if (!data.psychologists.some((item) => item.id === sessionForm.psychologistId)) {
      setSessionForm((form) => ({ ...form, psychologistId: data.psychologists[0].id }));
    }

    if (data.patients.length && !data.patients.some((item) => item.id === sessionForm.patientId)) {
      setSessionForm((form) => ({ ...form, patientId: data.patients[0].id }));
    }
  }, [data, patientForm.psychologistId, sessionForm.patientId, sessionForm.psychologistId]);

  const psychologistOptions = data.psychologists;
  const patientOptions = data.patients;

  const overviewStats = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const sessionsThisMonth = data.sessions.filter((session) => {
      const date = new Date(`${session.date}T00:00:00`);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    const nextAppointments = [...data.sessions]
      .filter((session) => session.status !== "cancelada")
      .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
      .slice(0, 4);

    const paidTotal = data.sessions.filter((item) => item.paid).reduce((sum, item) => sum + item.value, 0);
    const pendingTotal = data.sessions.filter((item) => !item.paid && item.status !== "cancelada").reduce((sum, item) => sum + item.value, 0);

    return {
      totalPsychologists: data.psychologists.length,
      totalPatients: data.patients.length,
      sessionsThisMonth,
      nextAppointments,
      paidTotal,
      pendingTotal,
    };
  }, [data]);

  const unpaidSessions = useMemo(
    () =>
      data.sessions
        .filter((session) => !session.paid && session.status !== "cancelada")
        .map((session) => {
          const patient = data.patients.find((item) => item.id === session.patientId);
          const psychologist = data.psychologists.find((item) => item.id === session.psychologistId);

          return {
            ...session,
            patientName: patient?.name ?? "Paciente removido",
            psychologistName: psychologist?.name ?? "Psicólogo removido",
            phone: patient?.phone ?? "Não informado",
          };
        }),
    [data],
  );

  const savePsychologist = (event: React.FormEvent) => {
    event.preventDefault();

    if (!psychologistForm.name.trim()) return;

    if (editingPsychologistId) {
      setData((current) => ({
        ...current,
        psychologists: current.psychologists.map((psychologist) =>
          psychologist.id === editingPsychologistId ? { ...psychologist, ...psychologistForm } : psychologist,
        ),
      }));
    } else {
      setData((current) => ({
        ...current,
        psychologists: [
          ...current.psychologists,
          {
            id: createId("psy"),
            ...psychologistForm,
          },
        ],
      }));
    }

    setPsychologistForm(emptyPsychologistForm);
    setEditingPsychologistId(null);
  };

  const editPsychologist = (psychologist: Psychologist) => {
    setEditingPsychologistId(psychologist.id);
    setPsychologistForm({
      name: psychologist.name,
      specialty: psychologist.specialty,
      email: psychologist.email,
      phone: psychologist.phone,
    });
  };

  const deletePsychologist = (psychologistId: string) => {
    setData((current) => ({
      ...current,
      psychologists: current.psychologists.filter((item) => item.id !== psychologistId),
      patients: current.patients.filter((item) => item.psychologistId !== psychologistId),
      sessions: current.sessions.filter((item) => item.psychologistId !== psychologistId),
    }));

    if (editingPsychologistId === psychologistId) {
      setEditingPsychologistId(null);
      setPsychologistForm(emptyPsychologistForm);
    }
  };

  const savePatient = (event: React.FormEvent) => {
    event.preventDefault();

    if (!patientForm.name.trim() || !patientForm.psychologistId) return;

    if (editingPatientId) {
      setData((current) => ({
        ...current,
        patients: current.patients.map((patient) =>
          patient.id === editingPatientId ? { ...patient, ...patientForm } : patient,
        ),
      }));
    } else {
      setData((current) => ({
        ...current,
        patients: [
          ...current.patients,
          {
            id: createId("pat"),
            ...patientForm,
          },
        ],
      }));
    }

    setPatientForm(emptyPatientForm(data.psychologists[0]?.id ?? ""));
    setEditingPatientId(null);
  };

  const editPatient = (patient: Patient) => {
    setEditingPatientId(patient.id);
    setPatientForm({
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      psychologistId: patient.psychologistId,
      note: patient.note,
    });
  };

  const deletePatient = (patientId: string) => {
    setData((current) => ({
      ...current,
      patients: current.patients.filter((item) => item.id !== patientId),
      sessions: current.sessions.filter((item) => item.patientId !== patientId),
    }));

    if (editingPatientId === patientId) {
      setEditingPatientId(null);
      setPatientForm(emptyPatientForm(data.psychologists[0]?.id ?? ""));
    }
  };

  const saveSession = (event: React.FormEvent) => {
    event.preventDefault();

    if (!sessionForm.psychologistId || !sessionForm.patientId || !sessionForm.date || !sessionForm.time) return;

    const valueNumber = Number(sessionForm.value) || 0;

    if (editingSessionId) {
      setData((current) => ({
        ...current,
        sessions: current.sessions.map((session) =>
          session.id === editingSessionId
            ? {
                ...session,
                psychologistId: sessionForm.psychologistId,
                patientId: sessionForm.patientId,
                date: sessionForm.date,
                time: sessionForm.time,
                status: sessionForm.status,
                value: valueNumber,
                paid: sessionForm.paid,
              }
            : session,
        ),
      }));
    } else {
      setData((current) => ({
        ...current,
        sessions: [
          ...current.sessions,
          {
            id: createId("ses"),
            psychologistId: sessionForm.psychologistId,
            patientId: sessionForm.patientId,
            date: sessionForm.date,
            time: sessionForm.time,
            status: sessionForm.status,
            value: valueNumber,
            paid: sessionForm.paid,
          },
        ],
      }));
    }

    setSessionForm(emptySessionForm(data.psychologists[0]?.id ?? "", data.patients[0]?.id ?? ""));
    setEditingSessionId(null);
  };

  const editSession = (session: Session) => {
    setEditingSessionId(session.id);
    setSessionForm({
      psychologistId: session.psychologistId,
      patientId: session.patientId,
      date: session.date,
      time: session.time,
      value: String(session.value),
      status: session.status,
      paid: session.paid,
    });
  };

  const deleteSession = (sessionId: string) => {
    setData((current) => ({
      ...current,
      sessions: current.sessions.filter((item) => item.id !== sessionId),
    }));

    if (editingSessionId === sessionId) {
      setEditingSessionId(null);
      setSessionForm(emptySessionForm(data.psychologists[0]?.id ?? "", data.patients[0]?.id ?? ""));
    }
  };

  const toggleSessionPaid = (sessionId: string) => {
    setData((current) => ({
      ...current,
      sessions: current.sessions.map((session) =>
        session.id === sessionId ? { ...session, paid: !session.paid } : session,
      ),
    }));
  };

  const handleOpenDebtorModal = (session: {
    id: string;
    patientName: string;
    phone: string;
    value: number;
  }) => {
    setSelectedDebtor({
      id: session.id,
      name: session.patientName,
      phone: session.phone,
      value: session.value,
    });
  };

  const handleCloseDebtorModal = () => setSelectedDebtor(null);

  const handleGeneratePaymentLink = () => {
    if (!selectedDebtor) return;

    const tag = "SUA_TAG_AQUI";
    const valor = selectedDebtor.value.toFixed(2);
    const checkoutUrl = `https://infinitepay.io/${tag}?amount=${valor}`;
    const formattedPhone = selectedDebtor.phone.replace(/\D/g, "");
    const message = `Olá ${selectedDebtor.name}, tudo bem? Segue o link da InfinitePay para o acerto da nossa sessão pendente no valor de ${formatCurrency(selectedDebtor.value)}: ${checkoutUrl}`;
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    toggleSessionPaid(selectedDebtor.id);
    handleCloseDebtorModal();
  };

  const statusClasses: Record<SessionStatus, string> = {
    agendada: "bg-sky-100 text-sky-700",
    realizada: "bg-emerald-100 text-emerald-700",
    cancelada: "bg-rose-100 text-rose-700",
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-800 px-5 py-7 text-white shadow-xl">
        <h2 className="mb-8 text-2xl font-bold tracking-tight text-sky-200">PsiManager</h2>

        {[
          { key: "dashboard", label: "📊 Painel Geral" },
          { key: "psychologists", label: "🧠 Psicólogos" },
          { key: "patients", label: "👥 Pacientes" },
          { key: "sessions", label: "📅 Sessões" },
          { key: "payments", label: "💰 Pagamentos" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveTab(item.key as TabKey)}
            className={`mb-3 flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
              activeTab === item.key ? "bg-sky-600 text-white" : "text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </aside>

      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Olá, Dr. Leonardo</h1>
          <p className="mt-1 text-sm text-slate-500">
            {activeTab === "dashboard" && "Acompanhe o quadro clínico, sessões e pagamentos em tempo real."}
            {activeTab === "psychologists" && "Cadastre e mantenha o perfil dos psicólogos da clínica."}
            {activeTab === "patients" && "Controle os pacientes ativos, suas informações e o responsável clínico."}
            {activeTab === "sessions" && "Agende, edite e acompanhe a rotina de atendimentos."}
            {activeTab === "payments" && "Monitore pendências e confirme recebimentos das sessões."}
          </p>
        </div>

        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <section className="grid gap-5 md:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Psicólogos</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{overviewStats.totalPsychologists}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Pacientes</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{overviewStats.totalPatients}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Sessões no mês</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{overviewStats.sessionsThisMonth}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Receita líquida</p>
                <p className="mt-3 text-3xl font-bold text-emerald-600">{formatCurrency(overviewStats.paidTotal)}</p>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Próximas Sessões</h2>

              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">Paciente</th>
                      <th className="px-4 py-3 font-medium">Psicólogo</th>
                      <th className="px-4 py-3 font-medium">Data</th>
                      <th className="px-4 py-3 font-medium">Horário</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overviewStats.nextAppointments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                          Nenhuma sessão agendada.
                        </td>
                      </tr>
                    )}
                    {overviewStats.nextAppointments.map((session) => {
                      const patient = data.patients.find((item) => item.id === session.patientId);
                      const psychologist = data.psychologists.find((item) => item.id === session.psychologistId);

                      return (
                        <tr key={session.id} className="border-t border-slate-200">
                          <td className="px-4 py-3 text-slate-800">{patient?.name ?? "Paciente removido"}</td>
                          <td className="px-4 py-3 text-slate-600">{psychologist?.name ?? "Psicólogo removido"}</td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(session.date)}</td>
                          <td className="px-4 py-3 text-slate-600">{session.time}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[session.status]}`}>
                              {session.status}
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

        {activeTab === "psychologists" && (
          <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
            <form onSubmit={savePsychologist} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">
                {editingPsychologistId ? "Editar psicólogo" : "Novo psicólogo"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Nome</label>
                  <input
                    value={psychologistForm.name}
                    onChange={(event) => setPsychologistForm({ ...psychologistForm, name: event.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-sky-500"
                    placeholder="Ex.: Dra. Ana Souza"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Especialidade</label>
                  <input
                    value={psychologistForm.specialty}
                    onChange={(event) => setPsychologistForm({ ...psychologistForm, specialty: event.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500"
                    placeholder="Ex.: Psicoterapia Infantil"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
                  <input
                    type="email"
                    value={psychologistForm.email}
                    onChange={(event) => setPsychologistForm({ ...psychologistForm, email: event.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500"
                    placeholder="nome@email.com"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Telefone</label>
                  <input
                    value={psychologistForm.phone}
                    onChange={(event) => setPsychologistForm({ ...psychologistForm, phone: event.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500"
                    placeholder="(11) 99999-1234"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
                    {editingPsychologistId ? "Salvar alterações" : "Adicionar psicólogo"}
                  </button>
                  {editingPsychologistId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPsychologistId(null);
                        setPsychologistForm(emptyPsychologistForm);
                      }}
                      className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </form>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Lista de psicólogos</h2>

              <div className="grid gap-4 md:grid-cols-2">
                {data.psychologists.map((psychologist) => (
                  <div key={psychologist.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{psychologist.name}</h3>
                        <p className="text-sm text-slate-500">{psychologist.specialty}</p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => editPsychologist(psychologist)} className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100">
                          Editar
                        </button>
                        <button type="button" onClick={() => deletePsychologist(psychologist.id)} className="rounded-md bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-200">
                          Excluir
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-slate-600">
                      <p>{psychologist.email}</p>
                      <p>{psychologist.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "patients" && (
          <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
            <form onSubmit={savePatient} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">{editingPatientId ? "Editar paciente" : "Novo paciente"}</h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Nome</label>
                  <input
                    value={patientForm.name}
                    onChange={(event) => setPatientForm({ ...patientForm, name: event.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500"
                    placeholder="Ex.: Maria Conceição"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Psicólogo responsável</label>
                  <select
                    value={patientForm.psychologistId}
                    onChange={(event) => setPatientForm({ ...patientForm, psychologistId: event.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500"
                  >
                    {data.psychologists.length === 0 && <option value="">Cadastre um psicólogo primeiro</option>}
                    {data.psychologists.map((psychologist) => (
                      <option key={psychologist.id} value={psychologist.id}>
                        {psychologist.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
                  <input
                    type="email"
                    value={patientForm.email}
                    onChange={(event) => setPatientForm({ ...patientForm, email: event.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500"
                    placeholder="paciente@email.com"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Telefone</label>
                  <input
                    value={patientForm.phone}
                    onChange={(event) => setPatientForm({ ...patientForm, phone: event.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500"
                    placeholder="(11) 98888-4567"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Observações</label>
                  <textarea
                    value={patientForm.note}
                    onChange={(event) => setPatientForm({ ...patientForm, note: event.target.value })}
                    className="min-h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500"
                    placeholder="Motivo da consulta, histórico ou observações relevantes"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
                    {editingPatientId ? "Salvar alterações" : "Adicionar paciente"}
                  </button>
                  {editingPatientId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPatientId(null);
                        setPatientForm(emptyPatientForm(data.psychologists[0]?.id ?? ""));
                      }}
                      className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </form>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Pacientes cadastrados</h2>

              <div className="grid gap-4 md:grid-cols-2">
                {data.patients.map((patient) => {
                  const psychologist = data.psychologists.find((item) => item.id === patient.psychologistId);

                  return (
                    <div key={patient.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{patient.name}</h3>
                          <p className="text-sm text-slate-500">Responsável: {psychologist?.name ?? "Não atribuído"}</p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => editPatient(patient)} className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100">
                            Editar
                          </button>
                          <button type="button" onClick={() => deletePatient(patient.id)} className="rounded-md bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-200">
                            Excluir
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-slate-600">
                        <p>{patient.email}</p>
                        <p>{patient.phone}</p>
                        <p className="text-slate-500">{patient.note || "Sem observações"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {activeTab === "sessions" && (
          <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
            <form onSubmit={saveSession} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">{editingSessionId ? "Editar sessão" : "Nova sessão"}</h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Psicólogo</label>
                  <select
                    value={sessionForm.psychologistId}
                    onChange={(event) => setSessionForm({ ...sessionForm, psychologistId: event.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500"
                  >
                    {data.psychologists.length === 0 && <option value="">Cadastre antes</option>}
                    {data.psychologists.map((psychologist) => (
                      <option key={psychologist.id} value={psychologist.id}>
                        {psychologist.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Paciente</label>
                  <select
                    value={sessionForm.patientId}
                    onChange={(event) => setSessionForm({ ...sessionForm, patientId: event.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500"
                  >
                    {data.patients.length === 0 && <option value="">Cadastre antes</option>}
                    {data.patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Data</label>
                    <input
                      type="date"
                      value={sessionForm.date}
                      onChange={(event) => setSessionForm({ ...sessionForm, date: event.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Hora</label>
                    <input
                      type="time"
                      value={sessionForm.time}
                      onChange={(event) => setSessionForm({ ...sessionForm, time: event.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Valor da sessão</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={sessionForm.value}
                    onChange={(event) => setSessionForm({ ...sessionForm, value: event.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                    <select
                      value={sessionForm.status}
                      onChange={(event) => setSessionForm({ ...sessionForm, status: event.target.value as SessionStatus })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500"
                    >
                      <option value="agendada">Agendada</option>
                      <option value="realizada">Realizada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>

                  <div className="pt-7">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={sessionForm.paid}
                        onChange={(event) => setSessionForm({ ...sessionForm, paid: event.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      Pagamento confirmado
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
                    {editingSessionId ? "Salvar sessão" : "Adicionar sessão"}
                  </button>
                  {editingSessionId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSessionId(null);
                        setSessionForm(emptySessionForm(data.psychologists[0]?.id ?? "", data.patients[0]?.id ?? ""));
                      }}
                      className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </form>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Agenda de atendimentos</h2>

              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">Paciente</th>
                      <th className="px-4 py-3 font-medium">Psicólogo</th>
                      <th className="px-4 py-3 font-medium">Data</th>
                      <th className="px-4 py-3 font-medium">Valor</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sessions.map((session) => {
                      const patient = data.patients.find((item) => item.id === session.patientId);
                      const psychologist = data.psychologists.find((item) => item.id === session.psychologistId);

                      return (
                        <tr key={session.id} className="border-t border-slate-200">
                          <td className="px-4 py-3 text-slate-800">{patient?.name ?? "Paciente"}</td>
                          <td className="px-4 py-3 text-slate-600">{psychologist?.name ?? "Psicólogo"}</td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(session.date)} · {session.time}</td>
                          <td className="px-4 py-3 font-semibold text-slate-700">{formatCurrency(session.value)}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[session.status]}`}>
                              {session.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button type="button" onClick={() => editSession(session)} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200">Editar</button>
                              <button type="button" onClick={() => deleteSession(session.id)} className="rounded-md bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-200">Excluir</button>
                              {!session.paid && session.status !== "cancelada" && (
                                <button type="button" onClick={() => toggleSessionPaid(session.id)} className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200">
                                  Marcar pago
                                </button>
                              )}
                            </div>
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

        {activeTab === "payments" && (
          <div className="space-y-6">
            <section className="grid gap-5 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                <p className="text-sm font-medium text-emerald-700">Recebido</p>
                <p className="mt-3 text-3xl font-bold text-emerald-700">{formatCurrency(overviewStats.paidTotal)}</p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
                <p className="text-sm font-medium text-rose-700">Pendências</p>
                <p className="mt-3 text-3xl font-bold text-rose-700">{formatCurrency(overviewStats.pendingTotal)}</p>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Cobranças pendentes</h2>

              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">Paciente</th>
                      <th className="px-4 py-3 font-medium">Psicólogo</th>
                      <th className="px-4 py-3 font-medium">Contato</th>
                      <th className="px-4 py-3 font-medium">Data</th>
                      <th className="px-4 py-3 font-medium">Valor</th>
                      <th className="px-4 py-3 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unpaidSessions.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                          Nenhuma pendência de pagamento no momento.
                        </td>
                      </tr>
                    )}
                    {unpaidSessions.map((session) => (
                      <tr
                        key={session.id}
                        onClick={() => handleOpenDebtorModal(session)}
                        className="cursor-pointer border-t border-slate-200 bg-rose-50 transition hover:bg-rose-100"
                      >
                        <td className="px-4 py-3 font-medium text-slate-800">{session.patientName}</td>
                        <td className="px-4 py-3 text-slate-600">{session.psychologistName}</td>
                        <td className="px-4 py-3 text-slate-600">{session.phone}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(session.date)}</td>
                        <td className="px-4 py-3 font-semibold text-rose-600">{formatCurrency(session.value)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleOpenDebtorModal(session);
                              }}
                              className="rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700"
                            >
                              Cobrar
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleSessionPaid(session.id);
                              }}
                              className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
                            >
                              Confirmar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
              <span className="font-semibold text-slate-800">Valor:</span> {selectedDebtor ? formatCurrency(selectedDebtor.value) : ""}
            </p>
            <p className="text-xs text-slate-400">
              Enviado à API como <span className="font-semibold text-slate-500">{selectedDebtor ? Math.round(selectedDebtor.value * 100) : 0}</span> centavos
            </p>
          </div>

          <button
            type="button"
            onClick={handleGeneratePaymentLink}
            className="mt-6 w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            ⚡ Gerar Checkout InfinitePay e Notificar
          </button>

          <button
            type="button"
            onClick={handleCloseDebtorModal}
            className="mt-3 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
