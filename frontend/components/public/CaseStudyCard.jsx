import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

export default function CaseStudyCard({ item }) {
  return (
    <article className="card-surface group flex h-full flex-col p-6 transition duration-500 hover:border-gold/20">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h3 className="font-serif text-2xl text-bone">{item.titulo}</h3>
        {item.url_externa && (
          <a
            href={item.url_externa}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold transition hover:text-gold-soft"
            aria-label={`Visitar ${item.titulo}`}
          >
            <ArrowUpRight className="h-5 w-5" />
          </a>
        )}
      </div>
      <p className="mb-6 flex-1 text-sm leading-relaxed text-muted">{item.resumen}</p>
      <p className="mb-6 text-xs uppercase tracking-[0.2em] text-gold/80">{item.stack}</p>
      <Link href={`/portafolio/${item.slug}`} className="text-sm text-gold-soft transition hover:text-gold">
        Ver caso de estudio
      </Link>
    </article>
  )
}
