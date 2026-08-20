import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const psychologistSchema = z.object({
  name: z.string().min(2).optional(),
  specialty: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const psychologists = await prisma.psychologist.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    psychologists.map((psychologist) => ({
      ...psychologist,
      name: psychologist.user.name,
      email: psychologist.user.email,
    })),
  );
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = psychologistSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const psychologist = await prisma.psychologist.upsert({
    where: { userId: currentUser.id },
    create: {
      userId: currentUser.id,
      specialty: parsed.data.specialty,
      phone: parsed.data.phone ?? "",
    },
    update: {
      specialty: parsed.data.specialty,
      phone: parsed.data.phone ?? "",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return NextResponse.json({
    ...psychologist,
    name: psychologist.user.name,
    email: psychologist.user.email,
  });
}
