import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  return NextResponse.json({
    user: session?.user
      ? {
          id: session.user.id ?? null,
          email: session.user.email ?? null,
          name: session.user.name ?? null,
          image: session.user.image ?? null,
        }
      : null,
  });
}
