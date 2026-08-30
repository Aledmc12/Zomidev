'use client'

import { useState } from 'react'
import { useFormVehiculo } from '@/hooks/useFormVehiculo'
import FormSection from '@/components/form/FormSection'
import CheckboxRow from '@/components/form/CheckboxRow'
import SignaturePad from '@/components/form/SignaturePad'
import PhotoPicker from '@/components/form/PhotoPicker'
import CroquisModal from '@/components/form/CroquisModal'
import {
  BRANDS,
  CARROCERIA_FIELDS,
  CITIES_CO,
  COMBUSTIBLE_OPTIONS,
  EMAIL_DESTINO_ANA,
  FORM_NUMBER_TEST,
  EQUIPO_CARRETERA_FIELDS,
  EQUIPO_EXT_FIELDS,
  INTERIOR_BOOL_FIELDS,
  LLANTAS_FIELDS,
  LOGISTICA_PERSONAS,
  MOTOR_BOOL_FIELDS,
  VIDRIOS_FIELDS,
} from '@/lib/form/constants'
import type { FormularioVehiculo } from '@/lib/models/FormularioVehiculo'

export default function FormVehiculo() {
  const vm = useFormVehiculo()
  const [croquisOpen, setCroquisOpen] = useState(false)
  const [emailOtro, setEmailOtro] = useState(false)

  if (vm.isHydrating) {
    return <div className="flex min-h-screen items-center justify-center text-gray-500">Cargando formulario...</div>
  }

  const dg = vm.form.datosGenerales
  const setDg = (patch: Partial<typeof dg>) =>
    vm.patchSection('datosGenerales', { ...dg, ...patch })

  const patchFirma = (role: 'entrega' | 'recibe' | 'verifica', patch: Partial<FormularioVehiculo['firmas']['entrega']>) => {
    vm.setForm({
      ...vm.form,
      firmas: { ...vm.form.firmas, [role]: { ...vm.form.firmas[role], ...patch } },
    })
  }

  return (
    <div className="mx-auto max-w-form px-4 pb-24 pt-16 md:px-8 md:pt-20">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-4 border-b border-gray-200 pb-4 md:flex-row md:items-start md:justify-between">
        <img src="/assets/logo.png" alt="" className="h-14 w-auto object-contain md:h-12" />
        <div className="text-center md:text-left">
          <p className="font-bold tracking-wide">CARRERA ARANGO SAS</p>
          <p className="text-sm text-gray-600">APP CARRERA ARANGO</p>
          <p className="text-xs text-gray-500">NIT: 800.211.038-7</p>
        </div>
        <div className="text-center md:text-right">
          <img src="/assets/logos_icontec.png" alt="ISO" className="mx-auto h-10 md:ml-auto md:mr-0" />
          <p className="text-xs">SC-CER164731</p>
          <p className="mt-1 text-lg font-bold">No. {vm.form.numeroFormulario || '-'}</p>
        </div>
      </header>

      {vm.message && (
        <p className={`mb-4 rounded-lg px-4 py-3 text-sm ${vm.message.type === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`} role="alert">
          {vm.message.text}
        </p>
      )}

      {/* Modo ingreso/salida */}
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {(['ingreso', 'salida'] as const).map((m) => (
          <button
            key={m}
            type="button"
            disabled={vm.isSaving}
            onClick={() => vm.setModo(m)}
            className={`rounded-lg px-4 py-2.5 text-sm font-bold md:px-5 ${vm.modo === m ? 'bg-carrera-red text-white' : 'bg-gray-100 text-gray-800'}`}
          >
            {m === 'ingreso' ? 'Formulario de Ingreso' : 'Formulario de Salida'}
          </button>
        ))}
      </div>

      {vm.isIngreso && (
        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium">Número de formulario</label>
          <select
            value={vm.form.numeroFormulario || ''}
            onChange={(e) => vm.setForm({ ...vm.form, numeroFormulario: Number(e.target.value) })}
            className="w-full"
          >
            <option value="">{vm.loadingNumeroOptions ? 'Cargando...' : 'Seleccionar'}</option>
            {vm.numeroOptions.map((n) => (
              <option key={n} value={n}>
                {n === FORM_NUMBER_TEST
                  ? 'No. 0 (prueba — reutilizable, no afecta numeración)'
                  : `No. ${n}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {!vm.isIngreso && (
        <FormSection title="VINCULAR INGRESO">
          <div className="md:col-span-2 space-y-3">
            <input
              placeholder="Buscar por VIN"
              value={vm.vinSearchQuery}
              onChange={(e) => vm.setVinSearchQuery(e.target.value)}
              className="w-full"
            />
            {vm.vinSearchQuery && vm.vinSearchResults.length > 0 && (
              <ul className="max-h-48 overflow-auto rounded-lg border">
                {vm.vinSearchResults.map((item) => (
                  <li key={item.id}>
                    <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50" onClick={() => vm.seleccionarIngresoBase(item)}>
                      VIN: {item.datosGenerales.chasis} — No. {item.numeroFormulario}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <select
              className="w-full"
              value={vm.selectedIngresoId || ''}
              onChange={(e) => {
                const ing = vm.ingresosDisponibles.find((i) => i.id === e.target.value)
                if (ing) vm.seleccionarIngresoBase(ing)
              }}
            >
              <option value="">{vm.loadingIngresos ? 'Cargando ingresos...' : 'Elegir ingreso para salida'}</option>
              {vm.ingresosDisponibles.map((item) => (
                <option key={item.id} value={item.id}>
                  No. {item.numeroFormulario} — {item.datosGenerales.chasis} — {item.datosGenerales.marca}
                </option>
              ))}
            </select>
          </div>
        </FormSection>
      )}

      <FormSection title="DATOS GENERALES">
        <div className="mb-3 md:col-span-1">
          <label className="mb-1 block text-sm">Ciudad</label>
          <select value={dg.ciudad} onChange={(e) => setDg({ ciudad: e.target.value })} className="w-full" required>
            <option value="">Seleccionar</option>
            {CITIES_CO.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="mb-3 md:col-span-1">
          <label className="mb-1 block text-sm">Marca</label>
          <select value={dg.marca} onChange={(e) => setDg({ marca: e.target.value })} className="w-full" required>
            <option value="">Seleccionar</option>
            {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="mb-3 md:col-span-1">
          <label className="mb-1 block text-sm">VIN / Chasis</label>
          <input value={dg.chasis} onChange={(e) => setDg({ chasis: e.target.value })} className="w-full" />
        </div>
        <div className="mb-3 md:col-span-1">
          <label className="mb-1 block text-sm">{vm.isIngreso ? 'Kilometraje ingreso' : 'Kilometraje salida'}</label>
          <input
            type="number"
            value={vm.kilometrajeInput}
            onChange={(e) => {
              vm.setKilometrajeInput(e.target.value)
              setDg({ kilometraje: Number(e.target.value) || 0 })
            }}
            className="w-full"
          />
        </div>
        <div className="mb-3 md:col-span-1">
          <label className="mb-1 block text-sm">Empresa transportadora</label>
          <input value={dg.empresa} onChange={(e) => setDg({ empresa: e.target.value })} className="w-full" />
        </div>
        <div className="mb-3 md:col-span-1">
          <label className="mb-1 block text-sm">Tipo vehículo</label>
          <input value={dg.tipo} onChange={(e) => setDg({ tipo: e.target.value })} className="w-full" />
        </div>
        <div className="mb-3 md:col-span-1">
          <label className="mb-1 block text-sm">{vm.isIngreso ? 'Fecha ingreso' : 'Fecha salida'}</label>
          <input
            type="date"
            value={vm.isIngreso ? dg.fechaIngreso : dg.fechaSalida || ''}
            onChange={(e) => setDg(vm.isIngreso ? { fechaIngreso: e.target.value } : { fechaSalida: e.target.value })}
            className="w-full"
          />
        </div>
        <div className="mb-3 md:col-span-2">
          <label className="mb-1 block text-sm">Email destino PDF</label>
          <select
            value={emailOtro ? '__otro__' : vm.form.emailDestino || EMAIL_DESTINO_ANA}
            onChange={(e) => {
              if (e.target.value === '__otro__') setEmailOtro(true)
              else {
                setEmailOtro(false)
                vm.setForm({ ...vm.form, emailDestino: e.target.value })
              }
            }}
            className="w-full"
          >
            <option value={EMAIL_DESTINO_ANA}>{EMAIL_DESTINO_ANA}</option>
            <option value="__otro__">Otro email</option>
          </select>
          {emailOtro && (
            <input
              type="email"
              className="mt-2 w-full"
              placeholder="email@ejemplo.com"
              value={vm.form.emailDestino || ''}
              onChange={(e) => vm.setForm({ ...vm.form, emailDestino: e.target.value })}
            />
          )}
        </div>
      </FormSection>

      <FormSection title="INTERIOR">
        {INTERIOR_BOOL_FIELDS.map(({ key, label }) => (
          <CheckboxRow key={key} label={label} checked={!!vm.form.interior[key as keyof typeof vm.form.interior]} onChange={(v) => vm.patchBool('interior', key, v)} />
        ))}
        <div className="md:col-span-2 py-2">
          <label className="mb-1 block text-sm">Cinturones (cantidad)</label>
          <input type="number" value={vm.form.interior.cinturones || ''} onChange={(e) => vm.patchSection('interior', { ...vm.form.interior, cinturones: Number(e.target.value) || 0 })} className="w-full max-w-xs" />
        </div>
        <div className="md:col-span-2 py-2">
          <label className="mb-1 block text-sm">Llaves encendido</label>
          <input type="number" value={vm.form.interior.llavesEncendido || ''} onChange={(e) => vm.patchSection('interior', { ...vm.form.interior, llavesEncendido: Number(e.target.value) || 0 })} className="w-full max-w-xs" />
        </div>
      </FormSection>

      <FormSection title="MOTOR">
        {MOTOR_BOOL_FIELDS.map(({ key, label }) => (
          <CheckboxRow key={key} label={label} checked={!!vm.form.motor[key as keyof typeof vm.form.motor]} onChange={(v) => vm.patchBool('motor', key, v)} />
        ))}
        <div className="md:col-span-2 py-2">
          <label className="mb-1 block text-sm">Combustible</label>
          <select value={vm.form.motor.combustible} onChange={(e) => vm.patchSection('motor', { ...vm.form.motor, combustible: e.target.value as typeof vm.form.motor.combustible })} className="w-full max-w-xs">
            {COMBUSTIBLE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </FormSection>

      <FormSection title="EQUIPO CARRETERA">
        {EQUIPO_CARRETERA_FIELDS.map(({ key, label }) => (
          <CheckboxRow key={key} label={label} checked={!!vm.form.equipoCarretera[key as keyof typeof vm.form.equipoCarretera]} onChange={(v) => vm.patchBool('equipoCarretera', key, v)} />
        ))}
      </FormSection>

      <FormSection title="VÍDRIOS">
        {VIDRIOS_FIELDS.map(({ key, label }) => (
          <CheckboxRow key={key} label={label} checked={!!vm.form.vidrios[key as keyof typeof vm.form.vidrios]} onChange={(v) => vm.patchBool('vidrios', key, v)} />
        ))}
      </FormSection>

      <FormSection title="CARROCERÍA">
        {CARROCERIA_FIELDS.map(({ key, label }) => (
          <CheckboxRow key={key} label={label} checked={!!vm.form.carroceria[key as keyof typeof vm.form.carroceria]} onChange={(v) => vm.patchBool('carroceria', key, v)} />
        ))}
      </FormSection>

      <FormSection title="BATERÍA">
        <div className="md:col-span-2">
          <img src="/assets/imgbat.jpeg" alt="Batería" className="mb-3 max-h-32 rounded object-contain" />
          <label className="mb-1 block text-sm">{vm.isIngreso ? 'Medición entrada (V)' : 'Medición salida (V)'}</label>
          <input
            inputMode="decimal"
            placeholder="12.6"
            value={vm.isIngreso ? vm.bateriaEntradaInput : vm.bateriaSalidaInput}
            onChange={(e) => (vm.isIngreso ? vm.setBateriaEntradaInput : vm.setBateriaSalidaInput)(e.target.value)}
            className="w-full max-w-xs"
          />
        </div>
        <CheckboxRow label="Cambiar batería" checked={vm.form.motor.bateria.cambiar} onChange={(v) => vm.patchSection('motor', { ...vm.form.motor, bateria: { ...vm.form.motor.bateria, cambiar: v } })} />
      </FormSection>

      <FormSection title="EQUIPO EXTRA">
        {EQUIPO_EXT_FIELDS.map(({ key, label }) => (
          <CheckboxRow key={key} label={label} checked={!!vm.form.equipoExt[key as keyof typeof vm.form.equipoExt]} onChange={(v) => vm.patchBool('equipoExt', key, v)} />
        ))}
      </FormSection>

      <FormSection title="LLANTAS">
        {LLANTAS_FIELDS.map(({ key, label }) => (
          <CheckboxRow key={key} label={label} checked={!!vm.form.llantas[key as keyof typeof vm.form.llantas]} onChange={(v) => vm.patchBool('llantas', key, v)} />
        ))}
      </FormSection>

      <FormSection title="ACCESORIOS">
        {(['acc1', 'acc2', 'acc3', 'acc4', 'acc5'] as const).map((k, i) => (
          <div key={k} className="mb-2 md:col-span-1">
            <input placeholder={`Accesorio ${i + 1}`} value={vm.form.accesorios[k]} onChange={(e) => vm.patchSection('accesorios', { ...vm.form.accesorios, [k]: e.target.value })} className="w-full" />
          </div>
        ))}
      </FormSection>

      <FormSection title="FOTOS Y CROQUIS">
        <PhotoPicker files={vm.photoFiles} onChange={vm.setPhotoFiles} />
        <div className="md:col-span-2 mt-2">
          <button type="button" className="rounded-lg border border-carrera-red px-4 py-2 text-sm text-carrera-red" onClick={() => setCroquisOpen(true)}>
            {vm.croquis ? 'Editar croquis' : 'Dibujar croquis'}
          </button>
          {vm.croquis && <img src={vm.croquis} alt="Croquis" className="mt-3 max-h-40 rounded border" />}
        </div>
      </FormSection>

      <FormSection title="OBSERVACIONES">
        <textarea
          className="min-h-[100px] w-full md:col-span-2"
          value={vm.form.observaciones}
          onChange={(e) => vm.patchSection('observaciones', e.target.value)}
          placeholder="Novedades (una por línea)"
        />
      </FormSection>

      <FormSection title="FIRMAS">
        {(['entrega', 'recibe'] as const).map((role) => (
          <div key={role} className="md:col-span-2 mb-4 rounded-lg border p-4">
            <p className="mb-3 font-semibold capitalize">{role === 'entrega' ? 'Entrega' : 'Recibe'}</p>
            <div className="grid gap-3 md:grid-cols-3">
              <input placeholder="Empresa" value={vm.form.firmas[role].empresa} onChange={(e) => patchFirma(role, { empresa: e.target.value })} />
              <select
                value={vm.form.firmas[role].nombre}
                onChange={(e) => {
                  const p = LOGISTICA_PERSONAS.find((x) => x.nombre === e.target.value)
                  patchFirma(role, { nombre: e.target.value, cedula: p?.cedula || vm.form.firmas[role].cedula })
                }}
              >
                <option value="">Nombre</option>
                {LOGISTICA_PERSONAS.map((p) => <option key={p.cedula} value={p.nombre}>{p.nombre}</option>)}
              </select>
              <input placeholder="Cédula" value={vm.form.firmas[role].cedula} onChange={(e) => patchFirma(role, { cedula: e.target.value })} />
            </div>
            <SignaturePad label="Firma" value={vm.form.firmas[role].firma} onChange={(url) => patchFirma(role, { firma: url })} />
          </div>
        ))}
        <div className="md:col-span-2 rounded-lg border p-4">
          <p className="mb-3 font-semibold">Verifica — {vm.form.firmas.verifica.nombre}</p>
          {vm.form.firmas.verifica.firma && (
            <img src={vm.form.firmas.verifica.firma} alt="Firma verifica" className="max-h-20" />
          )}
        </div>
      </FormSection>

      <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4 md:static md:border-0 md:bg-transparent md:p-0">
        <button
          type="button"
          disabled={vm.isSaving}
          onClick={vm.guardar}
          className="w-full rounded-xl bg-carrera-red py-4 text-lg font-bold text-white disabled:opacity-60 md:py-3 md:text-base"
        >
          {vm.isSaving ? 'Guardando...' : 'Guardar formulario'}
        </button>
      </div>

      <CroquisModal open={croquisOpen} onClose={() => setCroquisOpen(false)} onSave={(url) => vm.setCroquis(url)} />
    </div>
  )
}
