import Link from 'next/link';
import { InsightCard } from '@/components/cards/insight-card';
import { insights } from '@/lib/cms/data';

export function LatestInsightsSection() {
  return (
    <section className="container py-4">
      <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-3">
        <h2 className="gold text-sm font-black uppercase tracking-widest">Latest Insights</h2>
        <Link className="gold text-sm font-black uppercase" href="/intelligence">
          View All Insights →
        </Link>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {insights.map(([kind, title, date, read]) => (
          <InsightCard key={title} k={kind} title={title} date={date} read={read} />
        ))}
      </div>
    </section>
  );
}
