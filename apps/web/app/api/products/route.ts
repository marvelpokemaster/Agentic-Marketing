import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRepo } from "@/lib/db/repo";
import { uploadAsset, uploadAssets } from "@/lib/storage/upload";

export async function GET() {
  const user = await getCurrentUser();
  const products = await getRepo().listProducts(user.id);
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const form = await request.formData();

    const name = String(form.get("name") ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Product name is required." }, { status: 400 });
    }

    const description = String(form.get("description") ?? "").trim();
    const target_audience = String(form.get("target_audience") ?? "").trim();
    const industry = String(form.get("industry") ?? "").trim();
    const features = String(form.get("features") ?? "")
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);

    const logoFile = form.get("logo");
    const logo_url =
      logoFile instanceof File && logoFile.size > 0
        ? await uploadAsset(logoFile, user.id)
        : null;

    const imageFiles = form
      .getAll("images")
      .filter((f): f is File => f instanceof File && f.size > 0);
    const image_urls = await uploadAssets(imageFiles, user.id);

    const product = await getRepo().createProduct(user.id, {
      name,
      description,
      features,
      target_audience,
      industry,
      logo_url,
      image_urls,
    });

    return NextResponse.json({ product });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create product." },
      { status: 500 },
    );
  }
}
