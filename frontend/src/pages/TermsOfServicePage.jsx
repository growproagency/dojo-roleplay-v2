import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, FileText, ShieldCheck } from 'lucide-react';
import { termsDetails, termsSections } from '../data/termsOfService';

export function TermsOfServicePage() {
  useEffect(() => {
    const previous = document.title;
    document.title = 'Terms of Service | Dojo Roleplay';
    return () => { document.title = previous; };
  }, []);

  return <div className="min-h-screen bg-background text-foreground">
    <a href="#terms-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:p-3 focus:text-primary-foreground">Skip to terms</a>
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link to="/" className="inline-flex items-center gap-3 font-semibold tracking-tight"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></span>Dojo Roleplay</Link>
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to app</Link>
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
      <div className="max-w-3xl space-y-5">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary"><FileText className="h-4 w-4" />Platform terms</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Terms of Service</h1>
        <p className="text-lg leading-relaxed text-muted-foreground">The terms for practicing, learning, and managing your team with Dojo Roleplay.</p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-700 dark:text-amber-300">Draft for review</span><span>Last updated {termsDetails.updatedAt}</span></div>
        {termsDetails.status === 'draft' && <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
          This draft covers the current DRP features. The operator’s legal name, governing jurisdiction, legal contact, and final effective date still need to be confirmed before these terms are published as a final agreement.
        </div>}
      </div>
      <div className="mt-12 grid items-start gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
        <nav aria-label="Terms sections" className="rounded-xl border border-border p-5 lg:sticky lg:top-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">On this page</p>
          <ol className="space-y-3">{termsSections.map((section, index) => <li key={section.id}><a className="block text-sm leading-5 text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`#${section.id}`}>{index + 1}. {section.title}</a></li>)}</ol>
        </nav>
        <article id="terms-content" className="min-w-0 max-w-3xl space-y-10" aria-label="Terms of Service">
          {termsSections.map((section, index) => <section id={section.id} key={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-8 border-b border-border pb-9 last:border-b-0">
            <h2 id={`${section.id}-title`} className="mb-4 text-xl font-semibold tracking-tight">{index + 1}. {section.title}</h2>
            <div className="space-y-4 text-sm leading-7 text-muted-foreground">{section.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
              {section.bullets && <ul className="list-disc space-y-3 pl-5 marker:text-primary">{section.bullets.map(item => <li key={item}>{item}</li>)}</ul>}
            </div>
          </section>)}
          <section aria-labelledby="business-details-title" className="rounded-xl border border-border bg-muted/30 p-6">
            <h2 id="business-details-title" className="text-lg font-semibold">Business details</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Product</dt><dd className="mt-1 font-medium">{termsDetails.productName}</dd></div>
              <div><dt className="text-muted-foreground">Legal operator</dt><dd className="mt-1">{termsDetails.legalEntity || 'To be confirmed'}</dd></div>
              <div><dt className="text-muted-foreground">Governing jurisdiction</dt><dd className="mt-1">{termsDetails.jurisdiction || 'To be confirmed'}</dd></div>
              <div><dt className="text-muted-foreground">Legal contact</dt><dd className="mt-1">{termsDetails.contactEmail ? <a className="text-primary underline" href={`mailto:${termsDetails.contactEmail}`}>{termsDetails.contactEmail}</a> : 'To be confirmed'}</dd></div>
            </dl>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">For help with your account, contact your school administrator or open Support inside the app.</p>
            <Link to="/" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">Return to Dojo Roleplay<ArrowUpRight className="h-4 w-4" /></Link>
          </section>
        </article>
      </div>
    </main>
    <footer className="border-t border-border"><div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-5 py-6 text-xs text-muted-foreground sm:px-8"><span>Dojo Roleplay · Workplace training</span><span>Terms of Service · Draft dated {termsDetails.updatedAt}</span></div></footer>
  </div>;
}
