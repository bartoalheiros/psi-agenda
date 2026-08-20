import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";

import { createSessionToken, setAuthCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  specialty: z.string().min(2).optional(),
  phone: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { name, email, password, specialty, phone } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este e-mail já está em uso." },
        { status: 409 },
      );
    }

    const passwordHash = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        role: "PSYCHOLOGIST",
        psychologist: {
          create: {
            specialty: specialty ?? "Psicoterapia individual",
            phone: phone ?? "",
          },
        },
      },
      include: {
        psychologist: true,
      },
    });

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await setAuthCookie(token);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          psychologistId: user.psychologist?.id ?? null,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("register-error", error);
    return NextResponse.json(
      { error: "Não foi possível criar a conta." },
      { status: 500 },
    );
  }
}
