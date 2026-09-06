"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";

/** Client-side contact form that POSTs to /api/contact. */
export function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    orderNumber: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-3xl border border-sage-200 bg-white p-8 shadow-card">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-200 text-sage-600">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-serif text-2xl font-semibold text-charcoal-900">
          Message received
        </h2>
        <p className="mt-2 text-charcoal-600">
          Thanks for reaching out. We'll get back to you as soon as we can.
        </p>
        <p className="mt-4 text-sm text-charcoal-500">
          If it's urgent, you can also email us directly at support.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-cream-200 bg-white p-6 shadow-card sm:p-8"
    >
      <h2 className="font-serif text-2xl font-semibold text-charcoal-900">Send us a message</h2>
      <p className="mt-1 text-sm text-charcoal-500">
        We'll reply to your email. Please include your order number (if you have
        one) so we can help quickly.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Name" required>
          <input required value={form.name} onChange={set("name")} className="input-base" />
        </Field>
        <Field label="Email" required>
          <input required type="email" value={form.email} onChange={set("email")} className="input-base" />
        </Field>
        <Field label="Order number" optional>
          <input value={form.orderNumber} onChange={set("orderNumber")} className="input-base" />
        </Field>
        <Field label="Subject" required>
          <input required value={form.subject} onChange={set("subject")} className="input-base" />
        </Field>
      </div>

      <Field label="Message" required className="mt-4">
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={set("message")}
          className="input-base resize-y"
        />
      </Field>

      {error && (
        <p className="mt-4 rounded-xl border border-clay-200 bg-clay-100 p-3 text-sm text-charcoal-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="btn btn-primary mt-6 w-full sm:w-auto"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Sending…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" aria-hidden="true" />
            Send message
          </>
        )}
      </button>
    </form>
  );
}

function Field({
  label,
  required,
  optional,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="text-sm font-medium text-charcoal-700">
        {label}
        {optional && <span className="ml-1 text-charcoal-400">(optional)</span>}
        {required && <span className="ml-1 text-clay-500">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
