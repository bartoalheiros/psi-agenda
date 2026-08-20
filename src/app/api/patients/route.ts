import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  if (!currentUser.psychologistId) {
    return NextResponse.json({ patients: [] });
  }

  const patients = await prisma.patient.findMany({
    where: { psychologistId: currentUser.psychologistId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ patients });
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
  const parsed = patientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const patient = await prisma.patient.create({
    data: {
      psychologistId: currentUser.psychologistId,
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      notes: parsed.data.notes || null,
    },
  });

  return NextResponse.json({ patient }, { status: 201 });
}
