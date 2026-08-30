import { getSupabaseClient } from '@/lib/services/supabase.client'

export async function uploadToStorage(bucket: string, path: string, file: Blob | Uint8Array) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase no configurado')
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl)
  return res.blob()
}

export async function fileToCompressedBlob(file: File, maxWidthOrHeight = 1280): Promise<Blob> {
  const imageCompression = (await import('browser-image-compression')).default
  return imageCompression(file, {
    maxWidthOrHeight,
    maxSizeMB: 1.2,
    useWebWorker: true,
  })
}
