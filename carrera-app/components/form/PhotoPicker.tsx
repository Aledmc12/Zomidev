'use client'

type Props = {
  files: (File | string)[]
  onChange: (files: (File | string)[]) => void
}

export default function PhotoPicker({ files, onChange }: Props) {
  const addFiles = (list: FileList | null) => {
    if (!list) return
    onChange([...files, ...Array.from(list)])
  }

  return (
    <div className="md:col-span-2">
      <p className="mb-2 text-sm font-medium">Fotos del vehículo</p>
      <input type="file" accept="image/*" multiple capture="environment" onChange={(e) => addFiles(e.target.files)} className="w-full text-sm" />
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {files.map((f, i) => {
          const src = typeof f === 'string' ? f : URL.createObjectURL(f)
          return (
            <div key={i} className="relative aspect-square overflow-hidden rounded-lg border">
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                className="absolute right-1 top-1 rounded bg-black/60 px-2 py-0.5 text-xs text-white"
                onClick={() => onChange(files.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
