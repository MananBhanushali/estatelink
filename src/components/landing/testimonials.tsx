"use client";

import { Star } from "lucide-react";
import { ScrollReveal } from "@/components/shared/scroll-animation";

interface Testimonial {
  name: string;
  role: string;
  rating: number;
  comment: string;
  deal: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Rohan Mehta",
    role: "Client",
    rating: 5,
    comment: "Rajesh made my first home purchase seamless. The documentation was transparent and the entire process took less than two weeks.",
    deal: "Bandra 3BHK Sale",
  },
  {
    name: "Vikram Malhotra",
    role: "Client",
    rating: 4,
    comment: "Priya helped me close my lease in 48 hours. Very responsive on paperwork and clear communication with the owner.",
    deal: "Andheri 1BHK Rental",
  },
  {
    name: "Dr. Suresh Nair",
    role: "Client",
    rating: 5,
    comment: "Excellent service throughout. The commission was calculated automatically and I received my earnings on time.",
    deal: "Juhu 3BHK Sale",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 px-4">
      <ScrollReveal className="mb-12 transition-delay-100">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            What <span className="brand-gradient-text">Clients Say</span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-lg mx-auto">
            Verified reviews from clients after their deals closed.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
        {TESTIMONIALS.map((t, i) => {
          return (
            <ScrollReveal
              key={t.name}
              className={`
                p-6 rounded-xl border border-white/10 bg-white/5
                opacity-0 translate-y-6 animate-fade-in
                transition-all duration-700 ease-out
              `}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`size-4 ${star <= t.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}`}
                  />
                ))}
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-4 italic">
                &ldquo;{t.comment}&rdquo;
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-white">
                    {t.deal}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          )}
        )}
      </div>
    </section>
  );
}
