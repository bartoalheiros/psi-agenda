import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patientUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  psychologistId: z.string().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;

  const existingPatient = await prisma.patient.findUnique({ where: { id } });

  if (!existingPatient) {
    return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
  }

  if (currentUser.role !== "ADMIN" && existingPatient.psychologistId !== currentUser.psychologistId) {
    return NextResponse.json({ error: "Permissão negada." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = patientUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const patient = await prisma.patient.update({
    where: { id },
    data: {
      ...(payload.name ? { name: payload.name.trim() } : {}),
      ...(payload.email !== undefined ? { email: payload.email || null } : {}),
      ...(payload.phone !== undefined ? { phone: payload.phone || null } : {}),
      ...(payload.notes !== undefined ? { notes: payload.notes || null } : {}),
      ...(payload.psychologistId ? { psychologistId: payload.psychologistId } : {}),
    },
  });

  return NextResponse.json({ patient });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const patient = await prisma.patient.findUnique({ where: { id } });

  if (!patient) {
    return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
  }

  if (currentUser.role !== "ADMIN" && patient.psychologistId !== currentUser.psychologistId) {
    return NextResponse.json({ error: "Permissão negada." }, { status: 403 });
  }

  await prisma.patient.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
