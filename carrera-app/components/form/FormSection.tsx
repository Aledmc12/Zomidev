import type { ReactNode } from 'react'

export default function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <div className="mb-4 border-b-2 border-carrera-red pb-1">
        <h2 className="text-lg font-bold tracking-wide text-carrera-red md:text-base">{title}</h2>
      </div>
      <div className="md:grid md:grid-cols-2 md:gap-x-8">{children}</div>
    </section>
  )
}
