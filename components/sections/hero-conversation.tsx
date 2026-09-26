"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Types `text` out one character at a time after `startDelay`. With reduced
 * motion the whole text is there from the first frame: a message you have to
 * wait for is exactly the kind of motion that setting asks us to drop.
 */
function useTypewriter(text: string, speed = 38, startDelay = 600) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const now = window.setTimeout(() => setCount(text.length), 0);
      return () => window.clearTimeout(now);
    }
    let interval = 0;
    const timeout = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setCount((current) => {
          if (current >= text.length) {
            window.clearInterval(interval);
            return current;
          }
          return current + 1;
        });
      }, speed);
    }, startDelay);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [text, speed, startDelay]);

  return { displayed: text.slice(0, count), done: count >= text.length };
}

export type HeroPill = { label: string; href: string };

export function HeroConversation({
  text,
  pills,
  email,
  emailLabel,
  copiedLabel,
}: {
  text: string;
  pills: HeroPill[];
  email: string;
  emailLabel: string;
  copiedLabel: string;
}) {
  const { displayed, done } = useTypewriter(text);

  /* The buttons come in on their own clock, not after the typing: nobody
     should have to wait four seconds to find the way forward. */
  const [pillsIn, setPillsIn] = useState(false);
  useEffect(() => {
    const timeout = window.setTimeout(() => setPillsIn(true), 400);
    return () => window.clearTimeout(timeout);
  }, []);

  const [copied, setCopied] = useState(false);
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* No clipboard outside a secure context or when permission is refused:
         fall back to opening the mail client, which still gets them to us. */
      window.location.href = `mailto:${email}`;
    }
  };

  const pill =
    "mx-[0.2em] mb-[0.4em] inline-flex items-center justify-center whitespace-nowrap rounded-full border px-4 py-[0.3em] text-[13px] transition-colors duration-200 max-sm:min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:px-5 sm:text-[15px]";

  return (
    <>
      {/* The typed line is decoration for sighted visitors: the hero carries
          the same words as a real heading for screen readers and search.
          The full text is also laid out invisibly under the typed one, so the
          paragraph has its final height from the first frame: without it the
          buttons below would drop a line each time the typing wraps. */}
      <p
        aria-hidden
        className="mb-5 grid min-h-[54px] text-[clamp(18px,4vw,26px)] leading-[1.35] font-normal text-black sm:mb-6"
      >
        <span className="invisible col-start-1 row-start-1">{text}</span>
        <span className="col-start-1 row-start-1">
          {displayed}
          {done ? null : (
            <span className="ml-[2px] inline-block h-[1.1em] w-[2px] animate-[caret-blink_1s_step-end_infinite] bg-black align-middle" />
          )}
        </span>
      </p>

      <div
        className={`flex flex-wrap gap-y-1 transition-[opacity,transform] duration-400 ease-out ${pillsIn ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
      >
        {pills.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${pill} border-black/10 bg-white text-black hover:bg-black hover:text-white`}
          >
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={copyEmail}
          className={`${pill} gap-2 border-white bg-transparent text-white hover:bg-white hover:text-black sm:gap-3`}
        >
          <span aria-live="polite">
            {copied ? (
              copiedLabel
            ) : (
              <>
                {emailLabel}{" "}
                <span className="underline underline-offset-1">{email}</span>
              </>
            )}
          </span>
          <svg
            aria-hidden
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.2" />
            <path d="M8.5 1.5H2.2a.7.7 0 0 0-.7.7v6.3" />
          </svg>
        </button>
      </div>
    </>
  );
}
