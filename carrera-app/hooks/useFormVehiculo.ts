'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormularioVehiculo } from '@/lib/models/FormularioVehiculo'
import {
  applyDefaultFirmas,
  buildEmptyForm,
  buildSalidaFromIngreso,
  isDraftExpired,
  sanitizeForLocalDraft,
} from '@/lib/form/buildEmptyForm'
import {
  FORM_DRAFT_KEY,
  FORM_NUMBER_MIN,
  FORM_NUMBER_OPTIONS_COUNT,
  FormMode,
  isValidFormNumber,
  LAST_INGRESO_KEY,
} from '@/lib/form/constants'
import { getSupabaseUrl } from '@/lib/config'
import { getCurrentUser } from '@/lib/services/auth.service'
import {
  clearLocalFormularios,
  contarFormularios,
  crearFormulario,
  listarIngresosDisponiblesParaSalida,
  numeroFormularioExisteEnTipo,
  obtenerSugerenciasNumeroFormulario,
  sendPdfEmail,
} from '@/lib/services/formularios.service'
import { dataUrlToBlob, fileToCompressedBlob, uploadToStorage } from '@/lib/services/storage.service'

export function useFormVehiculo() {
  const supabaseUrl = getSupabaseUrl()
  const [modo, setModoState] = useState<FormMode>('ingreso')
  const [isSaving, setIsSaving] = useState(false)
  const [isHydrating, setIsHydrating] = useState(true)
  const [form, setForm] = useState<FormularioVehiculo>(() =>
    applyDefaultFirmas(buildEmptyForm(FORM_NUMBER_MIN, 'ingreso'), 'ingreso', supabaseUrl),
  )
  const [bateriaEntradaInput, setBateriaEntradaInput] = useState('')
  const [bateriaSalidaInput, setBateriaSalidaInput] = useState('')
  const [kilometrajeInput, setKilometrajeInput] = useState('')
  const [numeroOptions, setNumeroOptions] = useState<number[]>([])
  const [loadingNumeroOptions, setLoadingNumeroOptions] = useState(false)
  const [ingresosDisponibles, setIngresosDisponibles] = useState<FormularioVehiculo[]>([])
  const [loadingIngresos, setLoadingIngresos] = useState(false)
  const [selectedIngresoId, setSelectedIngresoId] = useState<string | null>(null)
  const [vinSearchQuery, setVinSearchQuery] = useState('')
  const [croquis, setCroquis] = useState<string | null>(null)
  const [photoFiles, setPhotoFiles] = useState<(File | string)[]>([])
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const formNumeroRef = useRef(form.numeroFormulario)

  useEffect(() => {
    formNumeroRef.current = form.numeroFormulario
  }, [form.numeroFormulario])

  const isIngreso = modo === 'ingreso'
  const vinSearchNormalized = vinSearchQuery.trim().toLowerCase()
  const vinSearchResults = useMemo(
    () =>
      vinSearchNormalized
        ? ingresosDisponibles
            .filter((item) => (item.datosGenerales.chasis || '').toLowerCase().includes(vinSearchNormalized))
            .slice(0, 25)
        : [],
    [vinSearchNormalized, ingresosDisponibles],
  )

  const loadNumeroOptions = useCallback(async () => {
    setLoadingNumeroOptions(true)
    try {
      const sugerencias = await obtenerSugerenciasNumeroFormulario(FORM_NUMBER_OPTIONS_COUNT, FORM_NUMBER_MIN)
      const actual = Number(formNumeroRef.current || 0)
      const merged = actual > 0 && !sugerencias.includes(actual) ? [actual, ...sugerencias] : sugerencias
      setNumeroOptions(Array.from(new Set(merged)).sort((a, b) => a - b))
    } catch {
      setNumeroOptions([])
    } finally {
      setLoadingNumeroOptions(false)
    }
  }, [])

  const loadIngresosDisponibles = useCallback(async () => {
    setLoadingIngresos(true)
    try {
      const ingresos = await listarIngresosDisponiblesParaSalida()
      setIngresosDisponibles([...ingresos].sort((a, b) => (b.numeroFormulario || 0) - (a.numeroFormulario || 0)))
    } catch {
      setIngresosDisponibles([])
    } finally {
      setLoadingIngresos(false)
    }
  }, [])

  const fetchNextNumero = useCallback(async () => {
    const sugerencias = await obtenerSugerenciasNumeroFormulario(1, FORM_NUMBER_MIN)
    return sugerencias[0] || FORM_NUMBER_MIN
  }, [])

  const switchMode = useCallback(
    async (targetMode: FormMode) => {
      const nextNumero = await fetchNextNumero()
      setModoState(targetMode)
      if (targetMode !== 'salida') setSelectedIngresoId(null)

      if (targetMode === 'salida') {
        loadIngresosDisponibles()
      }

      const draftKey = FORM_DRAFT_KEY(targetMode)
      try {
        const stored = localStorage.getItem(draftKey)
        if (stored) {
          const parsed = JSON.parse(stored)
          const draftPayload = parsed?.form ? parsed.form : parsed
          const savedAt = parsed?.savedAt
          if (parsed?.form && isDraftExpired(savedAt)) {
            localStorage.removeItem(draftKey)
          } else {
            if (nextNumero === 1) draftPayload.numeroFormulario = nextNumero
            setForm(
              applyDefaultFirmas(
                {
                  ...buildEmptyForm(nextNumero, targetMode),
                  ...draftPayload,
                  numeroFormulario: draftPayload.numeroFormulario || nextNumero,
                  tipoFormulario: targetMode,
                },
                targetMode,
                supabaseUrl,
              ),
            )
            return
          }
        }
      } catch {
        /* ignore */
      }
      setForm(applyDefaultFirmas(buildEmptyForm(nextNumero, targetMode), targetMode, supabaseUrl))
    },
    [fetchNextNumero, loadIngresosDisponibles, supabaseUrl],
  )

  const seleccionarIngresoBase = useCallback(
    (ingreso: FormularioVehiculo) => {
      const salida = buildSalidaFromIngreso(ingreso, Number(ingreso.numeroFormulario || 0), supabaseUrl)
      setModoState('salida')
      setSelectedIngresoId(ingreso.id)
      setVinSearchQuery(ingreso.datosGenerales.chasis || '')
      setForm(salida)
    },
    [supabaseUrl],
  )

  useEffect(() => {
    const hydrate = async () => {
      setIsHydrating(true)
      try {
        const total = await contarFormularios()
        if (Number.isFinite(total) && total === 0) clearLocalFormularios()
      } catch {
        /* ignore */
      }
      await switchMode('ingreso')
      await loadNumeroOptions()
      setIsHydrating(false)
    }
    hydrate()
    // Solo al montar — igual que la app móvil
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isHydrating) loadNumeroOptions()
  }, [modo, isHydrating, loadNumeroOptions])

  useEffect(() => {
    if (modo === 'salida' && !ingresosDisponibles.length && !loadingIngresos) {
      loadIngresosDisponibles()
    }
  }, [modo, ingresosDisponibles.length, loadingIngresos, loadIngresosDisponibles])

  const setModo = useCallback(
    (targetMode: FormMode) => {
      if (targetMode === modo || isSaving) return
      setVinSearchQuery('')
      switchMode(targetMode)
    },
    [modo, isSaving, switchMode],
  )

  useEffect(() => {
    if (isHydrating) return
    const safeDraft = sanitizeForLocalDraft({ ...form, tipoFormulario: modo })
    localStorage.setItem(FORM_DRAFT_KEY(modo), JSON.stringify({ savedAt: Date.now(), form: safeDraft }))
  }, [form, modo, isHydrating])

  useEffect(() => {
    if (modo === 'ingreso') {
      setKilometrajeInput(form.datosGenerales.kilometraje > 0 ? String(form.datosGenerales.kilometraje) : '')
      setBateriaEntradaInput(form.motor.bateria.voltajeEntrada ? String(form.motor.bateria.voltajeEntrada) : '')
    } else {
      setBateriaSalidaInput(form.motor.bateria.voltajeSalida ? String(form.motor.bateria.voltajeSalida) : '')
    }
  }, [modo, form.datosGenerales.kilometraje, form.motor.bateria.voltajeEntrada, form.motor.bateria.voltajeSalida])

  const patchSection = useCallback(
    <K extends keyof FormularioVehiculo>(section: K, value: FormularioVehiculo[K]) => {
      setForm((prev) => ({ ...prev, [section]: value }))
    },
    [],
  )

  const patchBool = useCallback(
    <S extends keyof FormularioVehiculo>(section: S, field: string, value: boolean) => {
      setForm((prev) => ({
        ...prev,
        [section]: { ...(prev[section] as object), [field]: value },
      }))
    },
    [],
  )

  async function uploadSignature(dataUrl: string | undefined, tipo: string, formId: string) {
    if (!dataUrl || dataUrl.length < 10) return ''
    if (dataUrl.startsWith('http')) return dataUrl
    const blob = await dataUrlToBlob(dataUrl.startsWith('data:') ? dataUrl : `data:image/png;base64,${dataUrl}`)
    return uploadToStorage('fotos', `firmas/${formId}/${tipo}-${Date.now()}.png`, blob)
  }

  const guardar = useCallback(async () => {
    if (isSaving) return
    setMessage(null)
    const user = await getCurrentUser()
    if (!user) {
      setMessage({ type: 'err', text: 'Debes iniciar sesión para guardar.' })
      return
    }
    if (!form.datosGenerales.marca || !form.datosGenerales.ciudad) {
      setMessage({ type: 'err', text: 'Marca y ciudad son obligatorias.' })
      return
    }
    if (!isValidFormNumber(form.numeroFormulario)) {
      setMessage({ type: 'err', text: 'Selecciona un número de formulario válido.' })
      return
    }

    const numeroYaExiste = await numeroFormularioExisteEnTipo(form.numeroFormulario, modo)
    if (numeroYaExiste) {
      await loadNumeroOptions()
      setMessage({ type: 'err', text: `El número ${form.numeroFormulario} ya existe para ${modo}.` })
      return
    }

    const bateriaRaw = (isIngreso ? bateriaEntradaInput : bateriaSalidaInput).trim()
    if (!/^\d+[.,]\d+$/.test(bateriaRaw)) {
      setMessage({
        type: 'err',
        text: isIngreso ? 'Batería de entrada: decimal obligatorio (ej: 12.6).' : 'Batería de salida: decimal obligatorio (ej: 12.6).',
      })
      return
    }
    const bateriaVal = Number(bateriaRaw.replace(',', '.'))

    let formConBateria: FormularioVehiculo = {
      ...form,
      motor: {
        ...form.motor,
        bateria: {
          ...form.motor.bateria,
          ...(isIngreso ? { voltajeEntrada: bateriaVal } : { voltajeSalida: bateriaVal }),
        },
      },
    }
    formConBateria = applyDefaultFirmas({ ...formConBateria, tipoFormulario: modo }, modo, supabaseUrl)

    setIsSaving(true)
    try {
      const fotosFuente = [...photoFiles]
      if (croquis) fotosFuente.push(croquis)
      const nuevasFotos: string[] = []
      for (let i = 0; i < fotosFuente.length; i++) {
        const item = fotosFuente[i]
        if (typeof item === 'string') {
          if (item.startsWith('http')) nuevasFotos.push(item)
          else if (item.startsWith('data:')) {
            const blob = await dataUrlToBlob(item)
            nuevasFotos.push(await uploadToStorage('fotos', `formularios/${formConBateria.id}/${Date.now()}-${i}.jpg`, blob))
          }
        } else {
          const blob = await fileToCompressedBlob(item)
          nuevasFotos.push(await uploadToStorage('fotos', `formularios/${formConBateria.id}/${Date.now()}-${i}.jpg`, blob))
        }
      }

      const [firmaEntrega, firmaRecibe, firmaVerifica] = await Promise.all([
        uploadSignature(formConBateria.firmas.entrega.firma, 'entrega', formConBateria.id),
        uploadSignature(formConBateria.firmas.recibe.firma, 'recibe', formConBateria.id),
        uploadSignature(formConBateria.firmas.verifica.firma, 'verifica', formConBateria.id),
      ])

      const formFinal: FormularioVehiculo = {
        ...formConBateria,
        fotos: nuevasFotos.filter((f) => f.startsWith('http')),
        firmas: {
          entrega: { ...formConBateria.firmas.entrega, firma: firmaEntrega },
          recibe: { ...formConBateria.firmas.recibe, firma: firmaRecibe },
          verifica: { ...formConBateria.firmas.verifica, firma: firmaVerifica || formConBateria.firmas.verifica.firma },
        },
      }

      await crearFormulario(formFinal)
      if (modo === 'ingreso') {
        localStorage.setItem(LAST_INGRESO_KEY, JSON.stringify({ savedAt: Date.now(), form: sanitizeForLocalDraft(formFinal) }))
      }
      const email = (formFinal.emailDestino || '').trim()
      if (email) {
        try { await sendPdfEmail(formFinal, email) } catch { /* optional */ }
      }
      setMessage({ type: 'ok', text: 'Formulario guardado correctamente.' })
      setPhotoFiles([])
      setCroquis(null)
      await switchMode(modo)
    } catch (e) {
      setMessage({ type: 'err', text: e instanceof Error ? e.message : 'Error al guardar.' })
    } finally {
      setIsSaving(false)
    }
  }, [isSaving, form, modo, isIngreso, bateriaEntradaInput, bateriaSalidaInput, photoFiles, croquis, supabaseUrl, loadNumeroOptions, switchMode])

  return {
    modo, setModo, form, setForm, patchSection, patchBool,
    isSaving, isHydrating, isIngreso,
    bateriaEntradaInput, setBateriaEntradaInput,
    bateriaSalidaInput, setBateriaSalidaInput,
    kilometrajeInput, setKilometrajeInput,
    numeroOptions, loadingNumeroOptions, loadNumeroOptions,
    ingresosDisponibles, loadingIngresos, loadIngresosDisponibles,
    selectedIngresoId, vinSearchQuery, setVinSearchQuery, vinSearchResults, seleccionarIngresoBase,
    croquis, setCroquis, photoFiles, setPhotoFiles, guardar, message,
  }
}
