import Link from 'next/link';
import { SectionDivider } from '@/components/brand/section-divider';
import { EngagementCard } from '@/components/cards/engagement-card';
import { engagements } from '@/lib/cms/data';

export function StrategicEngagementsSection() {
  return (
    <section className="container py-6">
      <div className="flex items-center justify-between">
        <SectionDivider>Strategic Engagements</SectionDivider>
        <Link className="gold hidden text-sm font-black uppercase md:block" href="/sectors">
          View All Engagements →
        </Link>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {engagements.map(([title, a, b, body]) => (
          <EngagementCard key={title} title={title} a={a} b={b} body={body} />
        ))}
      </div>
    </section>
  );
}
