import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const sessionSchema = z.object({
  patientId: z.string(),
  date: z.string(),
  time: z.string(),
  status: z.enum(["AGENDADA", "REALIZADA", "CANCELADA", "agendada", "realizada", "cancelada"]).optional(),
  value: z.number().min(0),
  paid: z.boolean().optional(),
});

function normalizeStatus(status?: string) {
  const raw = status?.toUpperCase();
  if (raw === "AGENDADA" || raw === "REALIZADA" || raw === "CANCELADA") {
    return raw;
  }

  return "AGENDADA";
}

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  if (!currentUser.psychologistId) {
    return NextResponse.json({ sessions: [] });
  }

  const sessions = await prisma.session.findMany({
    where: { psychologistId: currentUser.psychologistId },
    include: {
      patient: true,
      psychologist: true,
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  if (!currentUser.psychologistId) {
    return NextResponse.json(
      { error: "Este usuário não possui perfil de psicólogo." },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parsed = sessionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const patientExists = await prisma.patient.findFirst({
    where: {
      id: parsed.data.patientId,
      psychologistId: currentUser.psychologistId,
    },
  });

  if (!patientExists) {
    return NextResponse.json(
      { error: "Paciente não encontrado para este psicólogo." },
      { status: 404 },
    );
  }

  const session = await prisma.session.create({
    data: {
      psychologistId: currentUser.psychologistId,
      patientId: parsed.data.patientId,
      date: parsed.data.date,
      time: parsed.data.time,
      status: normalizeStatus(parsed.data.status),
      value: parsed.data.value,
      paid: parsed.data.paid ?? false,
    },
    include: {
      patient: true,
      psychologist: true,
    },
  });

  return NextResponse.json({ session }, { status: 201 });
}
