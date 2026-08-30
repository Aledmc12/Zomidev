import type { FormularioVehiculo } from '@/lib/models/FormularioVehiculo'
import { isProductionFormNumber, FORM_NUMBER_MIN, FORM_NUMBER_TEST, FORM_NUMBER_UI_MIN } from '@/lib/form/constants'
import { getSupabaseClient } from '@/lib/services/supabase.client'

const STORAGE_KEY = 'formularios_v1'

let registros: FormularioVehiculo[] = []
let loaded = false

const getNumeroFormulario = (item: Partial<FormularioVehiculo> | null | undefined) => {
  const n = Number(item?.numeroFormulario)
  if (!Number.isFinite(n)) return -1
  return n
}

const maxProductionNumero = (numeros: number[]) =>
  numeros.filter(isProductionFormNumber).reduce((acc, n) => (n > acc ? n : acc), 0)

const getMaxNumeroLocal = () =>
  maxProductionNumero(registros.map((item) => Number(item?.numeroFormulario ?? NaN)))

const getMaxNumeroRemoto = async (): Promise<number> => {
  const supabase = getSupabaseClient()
  if (!supabase) return 0
  try {
    const { data, error } = await supabase
      .from('formularios')
      .select('data->numeroFormulario')
      .order('created_at', { ascending: false })
      .limit(500)
    if (error || !data) return 0
    const numeros = (data as { numeroFormulario?: unknown }[]).map((row) =>
      Number(row?.numeroFormulario ?? NaN),
    )
    return maxProductionNumero(numeros)
  } catch {
    return 0
  }
}

export const obtenerSugerenciasNumeroFormulario = async (cantidad = 100, minimo = FORM_NUMBER_UI_MIN): Promise<number[]> => {
  if (!loaded) loadFromStorage()
  const maxLocal = getMaxNumeroLocal()
  const maxRemoto = await getMaxNumeroRemoto()
  const startMin = Math.max(FORM_NUMBER_UI_MIN, minimo)
  const base = Math.max(startMin - 1, maxLocal, maxRemoto)
  return Array.from({ length: Math.max(1, cantidad) }, (_, i) => base + i + 1).filter(
    (n) => n >= FORM_NUMBER_UI_MIN,
  )
}

const sanitizeForLocalCache = (item: FormularioVehiculo): FormularioVehiculo => ({
  ...item,
  fotos: [],
  firmas: {
    ...item.firmas,
    entrega: { ...item.firmas.entrega, firma: '' },
    recibe: { ...item.firmas.recibe, firma: '' },
    verifica: { ...item.firmas.verifica, firma: '' },
  },
})

const loadFromStorage = () => {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    registros = raw ? (JSON.parse(raw) as FormularioVehiculo[]).map(sanitizeForLocalCache) : []
  } catch {
    registros = []
  } finally {
    loaded = true
  }
}

const saveToStorage = () => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registros.map(sanitizeForLocalCache)))
  } catch {
    /* ignore quota */
  }
}

export const contarFormularios = async (): Promise<number> => {
  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      const { count, error } = await supabase.from('formularios').select('id', { count: 'exact', head: true })
      if (!error && typeof count === 'number') return count
    } catch {
      /* fallback local */
    }
  }
  if (!loaded) loadFromStorage()
  return registros.length
}

export const numeroFormularioExisteEnTipo = async (
  numero: number,
  tipo: 'ingreso' | 'salida',
): Promise<boolean> => {
  if (numero === FORM_NUMBER_TEST) return false
  if (!loaded) loadFromStorage()
  if (registros.some((r) => Number(r.numeroFormulario) === Number(numero) && r.tipoFormulario === tipo)) {
    return true
  }
  const supabase = getSupabaseClient()
  if (!supabase) return false
  try {
    const { data, error } = await supabase
      .from('formularios')
      .select('id')
      .eq('data->>numeroFormulario', String(numero))
      .eq('data->>tipoFormulario', tipo)
      .limit(1)
    if (!error && Array.isArray(data)) return data.length > 0
  } catch {
    return false
  }
  return false
}

const tryInsertToSupabase = async (data: FormularioVehiculo) => {
  const supabase = getSupabaseClient()
  if (!supabase) return { ok: false, reason: 'no-client' }
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { ok: false, reason: 'unauthenticated' }
  const { error } = await supabase.from('formularios').insert([{ id: data.id, user_id: user.id, data }])
  if (error) return { ok: false, reason: error.message }
  return { ok: true }
}

const fetchSupabaseFormularios = async (): Promise<FormularioVehiculo[]> => {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  try {
    const { data, error } = await supabase.from('formularios').select('data').order('created_at', { ascending: false })
    if (error || !data) return []
    return data.map((row: { data: FormularioVehiculo }) => row?.data).filter(Boolean)
  } catch {
    return []
  }
}

const filterIngresosDisponiblesParaSalida = (formularios: FormularioVehiculo[]) => {
  const salidasPorNumero = new Set(
    formularios
      .filter((f) => f?.tipoFormulario === 'salida')
      .map((f) => getNumeroFormulario(f))
      .filter((n) => n >= FORM_NUMBER_MIN),
  )
  return formularios.filter((f) => {
    if (!f || f.tipoFormulario !== 'ingreso') return false
    const numero = getNumeroFormulario(f)
    if (numero === FORM_NUMBER_TEST) return true
    return numero >= FORM_NUMBER_MIN && !salidasPorNumero.has(numero)
  })
}

/** Google Apps Script usa `valor || ''` — el número 0 se pierde; enviar como string. */
const buildSheetsPayload = (data: FormularioVehiculo): Record<string, unknown> => ({
  ...data,
  numeroFormulario: data.numeroFormulario === FORM_NUMBER_TEST ? '0' : data.numeroFormulario,
})

const tryPushToSheetsWebhook = async (data: FormularioVehiculo) => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)
    const response = await fetch('/api/formularios/sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildSheetsPayload(data)),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    const result = (await response.json()) as { ok?: boolean; reason?: string; detail?: string }
    if (!response.ok || !result.ok) {
      return { ok: false, reason: result.reason || result.detail || `http-${response.status}` }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : 'fetch-error' }
  }
}

export const crearFormulario = async (data: FormularioVehiculo) => {
  if (!loaded) loadFromStorage()
  const supaResult = await tryInsertToSupabase(data)
  if (!supaResult.ok) {
    const reason = supaResult.reason || 'error-desconocido'
    if (reason === 'unauthenticated') {
      throw new Error('Sesión expirada. Vuelve a iniciar sesión.')
    }
    if (reason === 'no-client') {
      throw new Error('Supabase no configurado en la aplicación.')
    }
    throw new Error(`No se pudo guardar en la base de datos: ${reason}`)
  }
  const sheetsResult = await tryPushToSheetsWebhook(data)
  registros.push(sanitizeForLocalCache({ ...data }))
  saveToStorage()
  return { success: true, supabase: supaResult, sheets: sheetsResult }
}

export const listarIngresosDisponiblesParaSalida = async (): Promise<FormularioVehiculo[]> => {
  const remotos = await fetchSupabaseFormularios()
  if (remotos.length) return filterIngresosDisponiblesParaSalida(remotos)
  if (!loaded) loadFromStorage()
  return filterIngresosDisponiblesParaSalida(registros)
}

export const clearLocalFormularios = () => {
  registros = []
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem('form_vehiculo_last_ingreso')
  localStorage.removeItem('form_vehiculo_draft_ingreso')
  localStorage.removeItem('form_vehiculo_draft_salida')
  saveToStorage()
}

export async function sendPdfEmail(form: FormularioVehiculo, emailDestino: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase no configurado')
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken) throw new Error('Sin sesión activa')

  const payload = { email: emailDestino, emails: [emailDestino], form }

  const invokeResult = await supabase.functions.invoke('generar-pdf-email', {
    body: payload,
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!invokeResult.error) return true

  const resp = await fetch('/api/formularios/pdf-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })
  if (!resp.ok) {
    const data = (await resp.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error || 'Error enviando PDF por correo')
  }
  return true
}
