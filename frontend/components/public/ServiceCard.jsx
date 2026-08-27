import {
  Globe,
  Smartphone,
  Server,
  Workflow,
  Shield,
  Code,
} from 'lucide-react'

const iconMap = {
  globe: Globe,
  smartphone: Smartphone,
  server: Server,
  workflow: Workflow,
  shield: Shield,
  code: Code,
}

export default function ServiceCard({ service }) {
  const Icon = iconMap[service.icono] || Code

  return (
    <article className="card-surface p-6 transition duration-500 hover:border-gold/20">
      <div className="mb-4 inline-flex rounded-full border border-gold/20 p-3 text-gold">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-serif text-xl text-bone">{service.titulo}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted">{service.descripcion}</p>
    </article>
  )
}
