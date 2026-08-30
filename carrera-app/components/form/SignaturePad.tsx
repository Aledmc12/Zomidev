'use client'

import { useRef } from 'react'
import SignatureCanvas from 'react-signature-canvas'

type Props = {
  label: string
  value?: string
  onChange: (dataUrl: string) => void
}

export default function SignaturePad({ label, value, onChange }: Props) {
  const ref = useRef<SignatureCanvas>(null)

  return (
    <div className="mb-4 md:col-span-2">
      <p className="mb-2 text-sm font-medium">{label}</p>
      {value && value.startsWith('http') ? (
        <img src={value} alt={label} className="max-h-24 rounded border" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-300 bg-white">
          <SignatureCanvas
            ref={ref}
            penColor="#111"
            canvasProps={{ className: 'w-full h-36 md:h-28 touch-none' }}
            onEnd={() => {
              if (ref.current && !ref.current.isEmpty()) {
                onChange(ref.current.toDataURL('image/png'))
              }
            }}
          />
        </div>
      )}
      <button
        type="button"
        className="mt-2 text-sm text-gray-500 underline"
        onClick={() => {
          ref.current?.clear()
          onChange('')
        }}
      >
        Limpiar firma
      </button>
    </div>
  )
}
