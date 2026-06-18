import { ArrowRight, Brain, Landmark, Search, Sparkles, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { AnimatedJ } from '@/components/three/animated-j';

const callouts: Array<{ title: string; body: string; Icon: LucideIcon }> = [
  { title: 'Government', body: 'Policy, governance and public sector transformation.', Icon: Landmark },
  { title: 'AI & Intelligent Systems', body: 'AI strategy, automation and intelligent solutions.', Icon: Brain },
  { title: 'Research & Intelligence', body: 'Data-driven insights and foresight for better decisions.', Icon: Search },
];

export function HomeHero() {
  return (
    <section className="container grid items-center gap-8 py-8 lg:grid-cols-[34%_1fr_24%]">
      <div>
        <p className="eyebrow">Strategic Advisory for a Changing World</p>
        <h1 className="serif mt-7 text-6xl leading-[.95] md:text-7xl">
          Intelligence.
          <br />
          Strategy.
          <br />
          <span className="gold">Real Impact.</span>
        </h1>
        <p className="mt-7 text-base leading-8 text-[var(--muted-foreground)]">
          JAR Advisory partners with governments, enterprises and visionary leaders to navigate complexity, build intelligent
          solutions and deliver enduring impact in regulated and high-stakes environments.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link className="btn btn-primary" href="/expertise">
            Explore Our Expertise <ArrowRight size={16} />
          </Link>
          <Link className="btn btn-secondary" href="/ask-jar">
            Ask JAR <Sparkles size={15} />
          </Link>
        </div>
      </div>
      <AnimatedJ />
      <div className="hidden space-y-14 lg:block">
        {callouts.map(({ title, body, Icon }) => (
          <div className="flex gap-5" key={title}>
            <div className="icon-ring">
              <Icon size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
