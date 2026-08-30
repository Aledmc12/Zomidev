import { getSupabaseClient } from '@/lib/services/supabase.client'

function storageErrorMessage(error: { message?: string; statusCode?: string }) {
  const msg = error.message || 'Error de almacenamiento'
  if (msg.includes('row-level security') || msg.includes('policy')) {
    return 'Sin permiso para subir archivos. Revisa las políticas del bucket fotos en Supabase.'
  }
  if (msg.includes('Bucket not found')) {
    return 'El bucket "fotos" no existe en Supabase Storage.'
  }
  return msg
}

export async function uploadToStorage(bucket: string, path: string, file: Blob | Uint8Array) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase no configurado')
  const contentType = file instanceof Blob ? file.type : 'application/octet-stream'
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: contentType || 'image/jpeg',
  })
  if (error) throw new Error(storageErrorMessage(error))
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/** Convierte data URL a Blob sin fetch (evita "Load failed" en Safari). */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  if (!dataUrl.startsWith('data:')) {
    throw new Error('Formato de imagen inválido')
  }
  const [header, base64] = dataUrl.split(',')
  if (!base64) throw new Error('Imagen vacía')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

export async function fileToCompressedBlob(file: File, maxWidthOrHeight = 1280): Promise<Blob> {
  const imageCompression = (await import('browser-image-compression')).default
  return imageCompression(file, {
    maxWidthOrHeight,
    maxSizeMB: 1.2,
    useWebWorker: false,
  })
}
