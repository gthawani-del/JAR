import { PageHero } from '@/components/sections/page-hero';
export default async function SectorDetail({params}:{params:Promise<{slug:string}>}){const{slug}=await params;return <PageHero eyebrow="Sector" title={slug.replaceAll('-',' ')} body="Sector detail content will be managed through the JAR CMS foundation."/>}
