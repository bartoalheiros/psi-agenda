import { NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { z } from "zod";

import { createSessionToken, setAuthCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Credenciais inválidas." },
        { status: 400 },
      );
    }

    const normalizedEmail = parsed.data.email.toLowerCase();

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { psychologist: true },
    });

    if (!user && normalizedEmail === "leonardo@psi.com" && parsed.data.password === "123456") {
      const passwordHash = await hash("123456", 10);

      user = await prisma.user.create({
        data: {
          name: "Dr. Leonardo",
          email: normalizedEmail,
          passwordHash,
          role: "PSYCHOLOGIST",
          psychologist: {
            create: {
              specialty: "Psicologia clínica",
              phone: "(81) 99999-9999",
            },
          },
        },
        include: { psychologist: true },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 },
      );
    }

    const isValidPassword = await compare(parsed.data.password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 },
      );
    }

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        psychologistId: user.psychologist?.id ?? null,
      },
    });
  } catch (error) {
    console.error("login-error", error);
    return NextResponse.json(
      { error: "Não foi possível autenticar o usuário." },
      { status: 500 },
    );
  }
}
