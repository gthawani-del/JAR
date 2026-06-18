import{Brain,Compass,Gamepad2,Landmark,Layers,Search}from'lucide-react';
const icons={Brain,Compass,Gamepad2,Landmark,Layers,Search};
export function ExpertiseCard({title,body,icon}:{title:string;body:string;icon:keyof typeof icons}){const Icon=icons[icon];return <article className="panel p-6"><div className="icon-ring mb-5"><Icon size={24}/></div><h3 className="text-sm font-black uppercase">{title}</h3><p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">{body}</p><a className="gold mt-6 inline-block text-xs font-black uppercase" href="/expertise">Learn More →</a></article>}
