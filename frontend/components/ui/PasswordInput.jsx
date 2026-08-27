'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function PasswordInput({ id, label, value, onChange, required = true, describedBy, invalid, hint }) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm text-muted">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required={required}
          value={value}
          onChange={onChange}
          aria-invalid={invalid || undefined}
          aria-describedby={[describedBy, hint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined}
          className="w-full rounded-xl border border-white/10 bg-bg px-4 py-3 pr-12 text-bone outline-none transition focus:border-gold/40"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-bone"
          aria-label={visible ? 'Ocultar contrasena' : 'Mostrar contrasena'}
        >
          {visible ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}
