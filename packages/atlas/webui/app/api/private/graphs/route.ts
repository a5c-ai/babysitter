import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createUserGraphUpload, listUserGraphUploads } from "@/lib/server/user-graphs";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uploads = await listUserGraphUploads(session.user.id);
  return NextResponse.json({ uploads });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing YAML file upload." }, { status: 400 });
  }

  const rawYaml = await file.text();
  const upload = await createUserGraphUpload({
    userId: session.user.id,
    title: title || file.name,
    description: description || undefined,
    sourceFilename: file.name,
    rawYaml,
  });

  return NextResponse.json({ upload }, { status: 201 });
}
