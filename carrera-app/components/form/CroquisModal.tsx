'use client'

import { useEffect, useRef } from 'react'
import SignatureCanvas from 'react-signature-canvas'

type Props = {
  open: boolean
  onClose: () => void
  onSave: (dataUrl: string) => void
}

export default function CroquisModal({ open, onClose, onSave }: Props) {
  const sigRef = useRef<SignatureCanvas>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  const exportCroquis = () => {
    const canvas = canvasRef.current
    const sig = sigRef.current
    if (!canvas || !sig || sig.isEmpty()) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = new Image()
    img.onload = () => {
      canvas.width = 800
      canvas.height = 500
      const scale = Math.min(800 / img.width, 500 / img.height)
      const dw = img.width * scale
      const dh = img.height * scale
      ctx.drawImage(img, (800 - dw) / 2, (500 - dh) / 2, dw, dh)
      const sigCanvas = sig.getCanvas()
      ctx.drawImage(sigCanvas, 0, 0, 800, 500)
      onSave(canvas.toDataURL('image/png'))
      onClose()
    }
    img.src = '/assets/imgcar.jpeg'
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 md:items-center md:p-4"
      style={{ touchAction: 'none' }}
    >
      <div className="max-h-[95vh] w-full max-w-3xl overflow-auto rounded-t-2xl bg-white p-4 md:rounded-2xl">
        <h3 className="mb-3 font-bold">Croquis del vehículo</h3>
        <div className="relative mx-auto max-w-full">
          <img src="/assets/imgcar.jpeg" alt="" className="mx-auto max-h-[40vh] w-auto opacity-30 md:max-h-72" />
          <div className="absolute inset-0 flex items-center justify-center">
            <SignatureCanvas
              ref={sigRef}
              penColor="#b30000"
              canvasProps={{ className: 'w-full max-w-lg h-[40vh] md:h-72 touch-none bg-transparent' }}
            />
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <div className="mt-4 flex gap-3">
          <button type="button" className="flex-1 rounded-lg border py-2" onClick={onClose}>Cancelar</button>
          <button type="button" className="flex-1 rounded-lg bg-carrera-red py-2 text-white" onClick={exportCroquis}>Guardar croquis</button>
        </div>
      </div>
    </div>
  )
}
