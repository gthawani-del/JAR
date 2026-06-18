import { SectionDivider } from '@/components/brand/section-divider';
import { ExpertiseCard, type ExpertiseIconKey } from '@/components/cards/expertise-card';
import { expertise } from '@/lib/cms/data';

export function ExpertiseSection() {
  return (
    <section className="container py-5">
      <SectionDivider>Our Expertise</SectionDivider>
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {expertise.map(([title, body, icon]) => (
          <ExpertiseCard key={title} title={title} body={body} icon={icon as ExpertiseIconKey} />
        ))}
      </div>
    </section>
  );
}
