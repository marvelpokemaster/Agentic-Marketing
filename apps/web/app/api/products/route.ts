import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getServerRepo } from "@/lib/db/repo";
import { uploadAsset, uploadAssets } from "@/lib/storage/upload";

export async function GET() {
  const user = await getCurrentUser();
  const repo = await getServerRepo();
  const products = await repo.listProducts(user.id);
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const reqId = Math.random().toString(36).substring(7);
  console.log(`[${reqId}] POST /api/products: Start`);
  try {
    console.log(`[${reqId}] Awaiting getCurrentUser()`);
    const user = await getCurrentUser();
    console.log(`[${reqId}] getCurrentUser() completed:`, user.id);
    
    console.log(`[${reqId}] Awaiting request.formData()`);
    const form = await request.formData();
    console.log(`[${reqId}] request.formData() completed`);

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
    let logo_url = null;
    if (logoFile instanceof File && logoFile.size > 0) {
      console.log(`[${reqId}] Awaiting uploadAsset (logo)`);
      logo_url = await uploadAsset(logoFile, user.id);
      console.log(`[${reqId}] uploadAsset (logo) completed:`, logo_url);
    }

    const imageFiles = form
      .getAll("images")
      .filter((f): f is File => f instanceof File && f.size > 0);
    
    console.log(`[${reqId}] Awaiting uploadAssets (images)`);
    const image_urls = await uploadAssets(imageFiles, user.id);
    console.log(`[${reqId}] uploadAssets (images) completed`);

    console.log(`[${reqId}] Awaiting getServerRepo()`);
    const repo = await getServerRepo();
    console.log(`[${reqId}] getServerRepo() completed`);

    console.log(`[${reqId}] Awaiting repo.createProduct()`);
    const product = await repo.createProduct(user.id, {
      name,
      description,
      features,
      target_audience,
      industry,
      logo_url,
      image_urls,
    });
    console.log(`[${reqId}] repo.createProduct() completed`);

    return NextResponse.json({ product });
  } catch (err) {
    console.error(`[${reqId}] Error in POST /api/products:`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create product." },
      { status: 500 },
    );
  }
}
