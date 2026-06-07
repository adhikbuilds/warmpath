import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/client";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prefs = await prisma.userPreference.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json(
      prefs ?? {
        userId: session.user.id,
        dailyEmailDigest: false,
        briefingTimeHour: null,
        onboardingGoal: null,
        tourCompleted: false,
      },
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data: {
      dailyEmailDigest?: boolean;
      briefingTimeHour?: number;
      onboardingGoal?: string | null;
      tourCompleted?: boolean;
    } = {};

    if (typeof body.dailyEmailDigest === "boolean") {
      data.dailyEmailDigest = body.dailyEmailDigest;
    }
    if ("briefingTimeHour" in body && body.briefingTimeHour != null) {
      data.briefingTimeHour = Number(body.briefingTimeHour);
    }
    if ("onboardingGoal" in body) {
      data.onboardingGoal = body.onboardingGoal ?? null;
    }
    if (typeof body.tourCompleted === "boolean") {
      data.tourCompleted = body.tourCompleted;
    }

    const prefs = await prisma.userPreference.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...data },
      update: data,
    });

    return NextResponse.json(prefs);
  } catch {
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
