import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const psychologistUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  specialty: z.string().min(2).optional(),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;

  if (currentUser.role !== "ADMIN" && currentUser.psychologistId !== id) {
    return NextResponse.json({ error: "Permissão negada." }, { status: 403 });
  }

  const existingPsychologist = await prisma.psychologist.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!existingPsychologist) {
    return NextResponse.json({ error: "Psicólogo não encontrado." }, { status: 404 });
  }

  const body = await request.json();
  const parsed = psychologistUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  const updatedPsychologist = await prisma.$transaction(async (tx) => {
    if (data.name || data.email) {
      await tx.user.update({
        where: { id: existingPsychologist.userId },
        data: {
          ...(data.name ? { name: data.name.trim() } : {}),
          ...(data.email ? { email: data.email.toLowerCase() } : {}),
        },
      });
    }

    return tx.psychologist.update({
      where: { id },
      data: {
        ...(data.specialty ? { specialty: data.specialty.trim() } : {}),
        ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
      },
      include: { user: true },
    });
  });

  return NextResponse.json({
    ...updatedPsychologist,
    name: updatedPsychologist.user.name,
    email: updatedPsychologist.user.email,
  });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;

  if (currentUser.role !== "ADMIN" && currentUser.psychologistId !== id) {
    return NextResponse.json({ error: "Permissão negada." }, { status: 403 });
  }

  const psychologist = await prisma.psychologist.findUnique({ where: { id } });

  if (!psychologist) {
    return NextResponse.json({ error: "Psicólogo não encontrado." }, { status: 404 });
  }

  // Soft-delete: marca deletedAt para preservar pacientes e sessões associadas
  await prisma.psychologist.update({ where: { id }, data: { deletedAt: new Date() } });

  return NextResponse.json({ success: true });
}
