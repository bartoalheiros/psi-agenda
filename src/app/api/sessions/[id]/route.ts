import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const sessionUpdateSchema = z.object({
  patientId: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  status: z.enum(["AGENDADA", "REALIZADA", "CANCELADA", "agendada", "realizada", "cancelada"]).optional(),
  value: z.number().min(0).optional(),
  paid: z.boolean().optional(),
});

function normalizeStatus(status?: string) {
  const raw = status?.toUpperCase();
  if (raw === "AGENDADA" || raw === "REALIZADA" || raw === "CANCELADA") {
    return raw;
  }

  return "AGENDADA";
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const session = await prisma.session.findUnique({ where: { id } });

  if (!session) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 404 });
  }

  if (currentUser.role !== "ADMIN" && session.psychologistId !== currentUser.psychologistId) {
    return NextResponse.json({ error: "Permissão negada." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = sessionUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  if (payload.patientId) {
    const patientExists = await prisma.patient.findFirst({
      where: {
        id: payload.patientId,
        psychologistId: currentUser.psychologistId ?? session.psychologistId,
      },
    });

    if (!patientExists) {
      return NextResponse.json(
        { error: "Paciente não encontrado para este psicólogo." },
        { status: 404 },
      );
    }
  }

  const updatedSession = await prisma.session.update({
    where: { id },
    data: {
      ...(payload.patientId ? { patientId: payload.patientId } : {}),
      ...(payload.date ? { date: payload.date } : {}),
      ...(payload.time ? { time: payload.time } : {}),
      ...(payload.status ? { status: normalizeStatus(payload.status) } : {}),
      ...(payload.value !== undefined ? { value: payload.value } : {}),
      ...(payload.paid !== undefined ? { paid: payload.paid } : {}),
    },
    include: {
      patient: true,
      psychologist: true,
    },
  });

  return NextResponse.json({ session: updatedSession });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const session = await prisma.session.findUnique({ where: { id } });

  if (!session) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 404 });
  }

  if (currentUser.role !== "ADMIN" && session.psychologistId !== currentUser.psychologistId) {
    return NextResponse.json({ error: "Permissão negada." }, { status: 403 });
  }

  await prisma.session.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
