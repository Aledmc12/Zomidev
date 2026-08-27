'use client'
import { useState } from 'react'
import Link from 'next/link'
import FadeIn from '@/components/ui/FadeIn'
import Button from '@/components/ui/Button'
import FormError from '@/components/ui/FormError'
import { api } from '@/lib/api'

export default function ContactoPage() {
  const [form, setForm] = useState({ nombre: '', email: '', asunto: '', empresa: '', mensaje: '', website: '' })
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!consent) {
      setStatus({ type: 'error', message: 'Debes aceptar la politica de privacidad para enviar el formulario.' })
      return
    }
    setLoading(true)
    setStatus({ type: '', message: '' })
    try {
      const res = await api.public.contact(form)
      setStatus({ type: 'success', message: res.message })
      setForm({ nombre: '', email: '', asunto: '', empresa: '', mensaje: '', website: '' })
      setConsent(false)
    } catch (err) {
      setStatus({ type: 'error', message: err.detail || 'No se pudo enviar el mensaje.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section-padding">
      <div className="container-narrow max-w-2xl">
        <FadeIn>
          <p className="text-sm uppercase tracking-[0.25em] text-gold">Contacto</p>
          <h1 className="mt-4 font-serif text-4xl text-bone md:text-5xl">Hablemos de tu proyecto</h1>
          <p className="mt-6 text-muted">
            Cuentanos tu idea. Respondemos con una propuesta clara, tiempos estimados y el enfoque tecnico mas adecuado.
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="mt-12">
          <form onSubmit={handleSubmit} className="card-surface space-y-5 p-8" aria-describedby={status.message ? 'contact-status' : undefined}>
            <input
              type="text"
              name="website"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />

            <div>
              <label htmlFor="nombre" className="mb-2 block text-sm text-muted">Nombre</label>
              <input id="nombre" type="text" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full rounded-xl border border-white/10 bg-bg px-4 py-3 text-bone outline-none transition focus:border-gold/40" />
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm text-muted">Email</label>
              <input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-white/10 bg-bg px-4 py-3 text-bone outline-none transition focus:border-gold/40" />
            </div>
            <div>
              <label htmlFor="asunto" className="mb-2 block text-sm text-muted">Asunto</label>
              <input id="asunto" type="text" required value={form.asunto} onChange={(e) => setForm({ ...form, asunto: e.target.value })} className="w-full rounded-xl border border-white/10 bg-bg px-4 py-3 text-bone outline-none transition focus:border-gold/40" />
            </div>
            <div>
              <label htmlFor="empresa" className="mb-2 block text-sm text-muted">Empresa (opcional)</label>
              <input id="empresa" type="text" value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} className="w-full rounded-xl border border-white/10 bg-bg px-4 py-3 text-bone outline-none transition focus:border-gold/40" />
            </div>
            <div>
              <label htmlFor="mensaje" className="mb-2 block text-sm text-muted">Mensaje</label>
              <textarea id="mensaje" required rows={5} value={form.mensaje} onChange={(e) => setForm({ ...form, mensaje: e.target.value })} className="w-full rounded-xl border border-white/10 bg-bg px-4 py-3 text-bone outline-none transition focus:border-gold/40" />
            </div>

            <label className="flex items-start gap-3 text-sm text-muted">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1"
                required
              />
              <span>
                Acepto el tratamiento de mis datos segun la{' '}
                <Link href="/politica-de-privacidad" className="text-gold hover:text-gold-soft">Politica de privacidad</Link>.
              </span>
            </label>

            {status.message && (
              <p id="contact-status" role={status.type === 'error' ? 'alert' : 'status'} aria-live="polite" className={`text-sm ${status.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>
                {status.message}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar mensaje'}
            </Button>
          </form>
        </FadeIn>
      </div>
    </section>
  )
}
