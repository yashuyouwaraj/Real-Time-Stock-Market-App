"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { toast } from "sonner";

type FooterProps = {
  userEmail?: string;
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
];

const legalLinks = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-of-service", label: "Terms of Service" },
];

const socialLinks = [
  { href: "https://x.com", label: "X (Twitter)", Icon: Twitter },
  { href: "https://linkedin.com", label: "LinkedIn", Icon: Linkedin },
  { href: "https://facebook.com", label: "Facebook", Icon: Facebook },
  { href: "https://instagram.com", label: "Instagram", Icon: Instagram },
];

export default function Footer({ userEmail }: FooterProps) {
  const pathname = usePathname();
  const [email, setEmail] = useState(userEmail || "");
  const [submitting, setSubmitting] = useState(false);
  const currentYear = new Date().getFullYear();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Enter an email address.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/email-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "subscribe" }),
      });

      const data = (await response.json().catch(() => null)) as { success?: boolean } | null;
      if (!response.ok || !data?.success) {
        toast.error("Subscription update failed. Try again.");
        return;
      }

      toast.success("Subscribed to marketing updates.");
    } catch {
      toast.error("Subscription update failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="mt-12 border-t border-gray-700/70 bg-gray-900/60 backdrop-blur-sm">
      <div className="container py-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 transition-colors duration-200 hover:text-yellow-400">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-yellow-500 text-yellow-950 font-bold">
                S
              </span>
              <span className="text-lg font-semibold text-gray-100">Signalist</span>
            </Link>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Real-time market tracking, watchlists, alerts, and AI-powered insights for disciplined investing.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-300">Navigation</h3>
            <ul className="mt-4 space-y-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`cursor-pointer text-sm transition-colors duration-200 hover:text-yellow-400 ${
                        isActive ? "text-yellow-400" : "text-gray-400"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-300">Legal</h3>
            <ul className="mt-4 space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`cursor-pointer text-sm transition-colors duration-200 hover:text-yellow-400 ${
                      pathname === link.href ? "text-yellow-400" : "text-gray-400"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center gap-2">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-gray-600 text-gray-300 transition-all duration-200 hover:border-yellow-400 hover:text-yellow-400"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-300">Newsletter</h3>
            <p className="mt-3 text-sm text-gray-400">Get product updates and market highlights.</p>
            <form className="mt-4 flex gap-2" onSubmit={onSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="h-10 w-full rounded-md border border-gray-600 bg-gray-900 px-3 text-sm text-gray-100 outline-none transition-colors duration-200 placeholder:text-gray-500 focus:border-yellow-400"
              />
              <button
                type="submit"
                disabled={submitting}
                className="h-10 rounded-md bg-yellow-500 px-4 text-sm font-semibold text-yellow-950 transition-colors duration-200 hover:bg-yellow-400 disabled:opacity-60"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-700/70 pt-5 text-center text-xs text-gray-500">
          (c) {currentYear} Signalist. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
