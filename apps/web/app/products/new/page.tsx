"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch("/api/products", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create product");
      router.push(`/products/${data.product.id}/generate`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">Add a product</h1>
      <p className="mb-6 text-muted">
        Tell the agent about your product. This drives all generated content.
      </p>

      <form onSubmit={onSubmit} className="card space-y-4">
        <div>
          <label className="label">Product name *</label>
          <input name="name" className="input" placeholder="AI Resume Builder" required />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            name="description"
            className="textarea"
            placeholder="What the product does and the value it delivers."
          />
        </div>

        <div>
          <label className="label">Key features (one per line)</label>
          <textarea
            name="features"
            className="textarea"
            placeholder={"ATS optimized resumes\nOne-click generation\nAI recommendations"}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Target audience</label>
            <input
              name="target_audience"
              className="input"
              placeholder="Students and job seekers"
            />
          </div>
          <div>
            <label className="label">Industry</label>
            <input name="industry" className="input" placeholder="Career / SaaS" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Logo</label>
            <input name="logo" type="file" accept="image/*" className="input" />
          </div>
          <div>
            <label className="label">Product images</label>
            <input
              name="images"
              type="file"
              accept="image/*"
              multiple
              className="input"
            />
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? "Saving…" : "Save & continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
