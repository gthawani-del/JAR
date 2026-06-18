import { PageHero } from '@/components/sections/page-hero';import{ContactForm}from'@/components/forms/contact-form';
export default function ContactPage(){return <><PageHero eyebrow="Contact" title="Let’s connect." body="Share your strategic challenge and the JAR team will review the best path forward."/><section className="container max-w-3xl"><ContactForm/></section></>}
