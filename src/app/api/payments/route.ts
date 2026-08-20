import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  if (!currentUser.psychologistId) {
    return NextResponse.json({ payments: [] });
  }

  const sessions = await prisma.session.findMany({
    where: {
      psychologistId: currentUser.psychologistId,
      paid: false,
      status: { not: "CANCELADA" },
    },
    include: {
      patient: true,
      psychologist: true,
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({
    payments: sessions.map((session) => ({
      id: session.id,
      patientName: session.patient.name,
      patientPhone: session.patient.phone,
      psychologistName: session.psychologist.userId,
      date: session.date,
      time: session.time,
      amount: session.value,
      paid: session.paid,
    })),
  });
}
