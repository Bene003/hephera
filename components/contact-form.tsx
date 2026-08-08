"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import type { Dictionary } from "@/lib/content";

type Status = "idle" | "sending" | "sent" | "error";

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-bone-50 outline-none transition-colors placeholder:text-bone-500/70 focus:border-ember-400/50 focus:bg-white/[0.05]";

const labelClass =
  "block text-xs font-medium tracking-[0.12em] text-bone-300 uppercase";

export function ContactForm({ form }: { form: Dictionary["contact"]["form"] }) {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus("sending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData)),
      });

      if (!response.ok) throw new Error("request failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex h-full min-h-80 flex-col items-center justify-center rounded-2xl border border-ember-500/25 bg-ember-500/[0.05] p-10 text-center">
        <CheckCircle2 className="size-10 text-ember-400" strokeWidth={1.4} />
        <p className="mt-5 max-w-sm leading-relaxed text-bone-100">
          {form.success}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 sm:p-8"
      noValidate={false}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="name">
            {form.name}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder={form.namePlaceholder}
            className={`mt-2 ${fieldClass}`}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="email">
            {form.email}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={form.emailPlaceholder}
            className={`mt-2 ${fieldClass}`}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="company">
            {form.company}
          </label>
          <input
            id="company"
            name="company"
            type="text"
            autoComplete="organization"
            placeholder={form.companyPlaceholder}
            className={`mt-2 ${fieldClass}`}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="subject">
            {form.subject}
          </label>
          <select
            id="subject"
            name="subject"
            required
            defaultValue=""
            className={`mt-2 ${fieldClass}`}
          >
            <option value="" disabled>
              {form.selectPlaceholder}
            </option>
            {form.subjectOptions.map((option) => (
              <option key={option} value={option} className="bg-ink-900">
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="budget">
            {form.budget}
          </label>
          <select
            id="budget"
            name="budget"
            defaultValue=""
            className={`mt-2 ${fieldClass}`}
          >
            <option value="" disabled>
              {form.selectPlaceholder}
            </option>
            {form.budgetOptions.map((option) => (
              <option key={option} value={option} className="bg-ink-900">
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="message">
            {form.message}
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={6}
            minLength={10}
            placeholder={form.messagePlaceholder}
            className={`mt-2 resize-y ${fieldClass}`}
          />
        </div>
      </div>

      {/* Honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute h-0 w-0 opacity-0"
      />

      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={status === "sending"}
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-ember-500 to-ember-600 px-7 py-3.5 text-sm font-medium text-ink-950 shadow-[0_10px_36px_-12px_rgba(255,122,24,0.75)] transition-all hover:from-ember-400 hover:to-ember-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "sending" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {form.submitting}
            </>
          ) : (
            <>
              {form.submit}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>

        {status === "error" ? (
          <p className="text-sm text-ember-300">{form.error}</p>
        ) : null}
      </div>
    </form>
  );
}
