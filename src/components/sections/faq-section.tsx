import { getContent } from "@/lib/content";

interface Faq {
  question: string;
  answer: string;
  page: string;
}

// Questions for one page ("Inquire" or "Offerings"); renders nothing until FAQs are added
export default async function FaqSection({ page }: { page: "Inquire" | "Offerings" }) {
  const { items } = await getContent<Faq>("faq");
  const faqs = items.filter((faq) => faq.page === page || faq.page === "Both pages");
  if (faqs.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <section className="bg-ivory text-charcoal py-16 sm:py-20 md:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }}
      />
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <div className="text-center">
          <p className="font-commuter-sans text-gold text-[11px] font-bold tracking-[0.3em] uppercase sm:text-[13px]">
            Questions &amp; Answers
          </p>
          <h2 className="font-epicene-display mt-3 text-[28px] leading-[1.1] font-light uppercase sm:text-[36px] md:text-[42px]">
            Frequently Asked
          </h2>
          <div className="mx-auto mt-5 h-[2px] w-14 bg-[#D9D5CF]" />
        </div>

        <div className="border-charcoal/15 divide-charcoal/15 mt-10 divide-y border-y sm:mt-14">
          {faqs.map((faq) => (
            <details key={faq.id} className="group py-5 sm:py-6">
              <summary className="font-lora flex cursor-pointer list-none items-start justify-between gap-6 text-[15px] leading-[1.6] sm:text-[17px] [&::-webkit-details-marker]:hidden">
                <span>{faq.question}</span>
                <span
                  className="text-gold mt-0.5 shrink-0 text-[22px] leading-none font-light transition-transform duration-300 group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="font-lora text-charcoal/80 mt-4 mb-0 pr-10 text-[14px] leading-[1.85] whitespace-pre-line sm:text-[15px]">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
