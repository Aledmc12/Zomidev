'use client'

import { useEffect, useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'

type Props = {
  label: string
  value?: string
  onChange: (dataUrl: string) => void
  readOnly?: boolean
}

export default function SignaturePad({ label, value, onChange, readOnly }: Props) {
  const sigRef = useRef<SignatureCanvas>(null)
  const [open, setOpen] = useState(false)

  const hasSignature = !!(value && (value.startsWith('data:') || value.startsWith('http')))

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const openModal = () => {
    setOpen(true)
    requestAnimationFrame(() => sigRef.current?.clear())
  }

  const handleSave = () => {
    const sig = sigRef.current
    if (!sig || sig.isEmpty()) return
    onChange(sig.toDataURL('image/png'))
    setOpen(false)
  }

  const handleClearSaved = () => {
    onChange('')
  }

  return (
    <div className="mb-4 md:col-span-2">
      <p className="mb-2 text-sm font-medium">{label}</p>

      <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4">
        {hasSignature ? (
          <div className="flex flex-col items-center gap-3">
            <img
              src={value}
              alt={label}
              className="max-h-28 w-full max-w-md rounded-lg border border-gray-200 bg-white object-contain"
            />
            {!readOnly && (
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-carrera-red px-4 py-2 text-sm font-semibold text-white"
                  onClick={openModal}
                >
                  Cambiar firma
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600"
                  onClick={handleClearSaved}
                >
                  Quitar firma
                </button>
              </div>
            )}
          </div>
        ) : (
          !readOnly && (
            <div className="py-4 text-center">
              <p className="mb-3 text-sm text-gray-500">Toque el botón para abrir el recuadro de firma</p>
              <button
                type="button"
                className="rounded-lg bg-carrera-red px-6 py-3 text-sm font-semibold text-white"
                onClick={openModal}
              >
                Firmar aquí
              </button>
            </div>
          )
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 md:items-center md:p-4"
          style={{ touchAction: 'none' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div
            className="w-full max-w-lg rounded-t-2xl bg-white p-4 shadow-xl md:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 text-lg font-bold">{label}</h3>
            <p className="mb-3 text-sm text-gray-500">Dibuje su firma en el recuadro y pulse Guardar firma</p>

            <div
              className="overflow-hidden rounded-xl border-2 border-carrera-red/40 bg-white"
              style={{ touchAction: 'none' }}
            >
              <SignatureCanvas
                ref={sigRef}
                penColor="#111"
                minWidth={1.5}
                maxWidth={2.5}
                canvasProps={{
                  className: 'h-48 w-full touch-none md:h-56',
                  style: { touchAction: 'none' },
                }}
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                type="button"
                className="rounded-lg border border-gray-300 py-3 text-sm font-medium"
                onClick={() => sigRef.current?.clear()}
              >
                Limpiar
              </button>
              <button
                type="button"
                className="rounded-lg border border-gray-300 py-3 text-sm font-medium"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-lg bg-carrera-red py-3 text-sm font-bold text-white"
                onClick={handleSave}
              >
                Guardar firma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
