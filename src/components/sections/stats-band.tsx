import { getContent } from "@/lib/content";

interface Stat {
  value: string;
  label: string;
}

// Facts already stated in the "Meet the heart behind the goosebumps" section, shown until the
// admin adds their own numbers
const DEFAULT_STATS: Stat[] = [
  { value: "15+", label: "Years of experience" },
  { value: "150+", label: "Weddings brought to life" },
];

const COLUMNS: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

export default async function StatsBand() {
  const { items, total } = await getContent<Stat>("stat");
  const stats = total === 0 ? DEFAULT_STATS : items;
  if (stats.length === 0) return null;

  return (
    <section className="bg-white py-14 sm:py-18 md:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <dl className={`grid grid-cols-2 gap-x-6 gap-y-12 ${COLUMNS[Math.min(stats.length, 4)]}`}>
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center text-center">
              {/* Label first for screen readers; shown under the number */}
              <dt className="font-commuter-sans text-charcoal/70 order-3 max-w-[200px] text-[10px] leading-relaxed tracking-[0.3em] uppercase sm:text-[11px]">
                {stat.label}
              </dt>
              <dd className="font-epicene-display text-charcoal order-1 text-[40px] leading-none font-light sm:text-[52px] md:text-[60px]">
                {stat.value}
              </dd>
              <div className="order-2 my-4 h-[2px] w-10 bg-[#D9D5CF] sm:my-5" aria-hidden="true" />
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
