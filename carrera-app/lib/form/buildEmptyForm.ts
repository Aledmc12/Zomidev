import { v4 as uuidv4 } from 'uuid'
import type { FormularioVehiculo } from '@/lib/models/FormularioVehiculo'
import {
  EMAIL_DESTINO_ANA,
  EMPRESA_VERIFICA,
  FormMode,
  getFirmaVerificaUrl,
  today,
} from '@/lib/form/constants'

export function buildEmptyForm(
  numeroFormulario: number,
  modo: FormMode,
  base?: Partial<FormularioVehiculo>,
): FormularioVehiculo {
  const baseDatos: Partial<FormularioVehiculo['datosGenerales']> = base?.datosGenerales || {}
  const interiorBase: Partial<FormularioVehiculo['interior']> = base?.interior || {}
  const motorBase: Partial<FormularioVehiculo['motor']> = base?.motor || {}
  const bateriaBase: Partial<FormularioVehiculo['motor']['bateria']> = motorBase.bateria || {}
  const equipoCarreteraBase: Partial<FormularioVehiculo['equipoCarretera']> = base?.equipoCarretera || {}
  const vidriosBase: Partial<FormularioVehiculo['vidrios']> = base?.vidrios || {}
  const carroceriaBase: Partial<FormularioVehiculo['carroceria']> = base?.carroceria || {}
  const equipoExtBase: Partial<FormularioVehiculo['equipoExt']> = base?.equipoExt || {}
  const llantasBase: Partial<FormularioVehiculo['llantas']> = base?.llantas || {}
  const accesoriosBase: Partial<FormularioVehiculo['accesorios']> = base?.accesorios || {}
  const firmasBase: Partial<FormularioVehiculo['firmas']> = base?.firmas || {}
  const isSalida = modo === 'salida'

  return {
    id: uuidv4(),
    numeroFormulario,
    tipoFormulario: modo,
    emailDestino: base?.emailDestino || EMAIL_DESTINO_ANA,
    datosGenerales: {
      fechaIngreso: baseDatos.fechaIngreso || today(),
      fechaSalida: isSalida ? today() : baseDatos.fechaSalida || '',
      ciudad: baseDatos.ciudad || '',
      marca: baseDatos.marca || '',
      chasis: baseDatos.chasis || '',
      kilometraje: isSalida ? 0 : baseDatos.kilometraje || 0,
      empresa: baseDatos.empresa || '',
      vendedor: baseDatos.vendedor || '',
      cliente: baseDatos.cliente || '',
      tipo: baseDatos.tipo || '',
      fecha: baseDatos.fecha || today(),
    },
    interior: {
      millare: interiorBase.millare || false,
      guantera: interiorBase.guantera || false,
      tablero: interiorBase.tablero || false,
      asientoConductor: interiorBase.asientoConductor || false,
      asientoDelanteroDerecho: interiorBase.asientoDelanteroDerecho || false,
      asientosPasajeros: interiorBase.asientosPasajeros || false,
      luzCabina: interiorBase.luzCabina || false,
      luzPasillo: interiorBase.luzPasillo || false,
      cinturones: typeof interiorBase.cinturones === 'number' ? interiorBase.cinturones : 0,
      radioMarca: interiorBase.radioMarca || false,
      parlantes: interiorBase.parlantes || false,
      parlantesPasillo: interiorBase.parlantesPasillo || false,
      ceniceros: interiorBase.ceniceros || false,
      encendedor: interiorBase.encendedor || false,
      emblemas: interiorBase.emblemas || false,
      panelesPuertas: interiorBase.panelesPuertas || false,
      espejoRetrovisor: interiorBase.espejoRetrovisor || false,
      apoyaCabezas: interiorBase.apoyaCabezas || false,
      manijas: interiorBase.manijas || false,
      pitoSirena: interiorBase.pitoSirena || false,
      espejoslaterales: interiorBase.espejoslaterales || false,
      estucheManuales: interiorBase.estucheManuales || false,
      llavesEncendido: interiorBase.llavesEncendido || 1,
    },
    motor: {
      encendido: motorBase.encendido || false,
      varillaAceite: motorBase.varillaAceite || false,
      tapaAceite: motorBase.tapaAceite || false,
      combustible: motorBase.combustible || 'Gasolina',
      bateria: {
        voltajeEntrada: bateriaBase.voltajeEntrada || 0,
        voltajeSalida: isSalida ? 0 : bateriaBase.voltajeSalida || 0,
        cambiar: bateriaBase.cambiar || false,
      },
    },
    equipoCarretera: {
      gato: equipoCarreteraBase.gato || false,
      palancaGato: equipoCarreteraBase.palancaGato || false,
      crucetaLLavePernos: equipoCarreteraBase.crucetaLLavePernos || false,
      herramientas: equipoCarreteraBase.herramientas || false,
      banderolas: equipoCarreteraBase.banderolas || false,
    },
    vidrios: {
      parabrisasDelantero: vidriosBase.parabrisasDelantero || false,
      parabrisasTrasero: vidriosBase.parabrisasTrasero || false,
      ventanaDelDer: vidriosBase.ventanaDelDer || false,
      ventanaDelIzq: vidriosBase.ventanaDelIzq || false,
      ventanaTraDer: vidriosBase.ventanaTraDer || false,
      ventanaTraIzq: vidriosBase.ventanaTraIzq || false,
      ventanasLaterales: vidriosBase.ventanasLaterales || false,
    },
    carroceria: {
      luces: carroceriaBase.luces || false,
      direccionalesDel: carroceriaBase.direccionalesDel || false,
      exploradoras: carroceriaBase.exploradoras || false,
      cocuyos: carroceriaBase.cocuyos || false,
      persiana: carroceriaBase.persiana || false,
      bomperDel: carroceriaBase.bomperDel || false,
      capot: carroceriaBase.capot || false,
      limpiabrisas: carroceriaBase.limpiabrisas || false,
      stops: carroceriaBase.stops || false,
      tapaTanqueCombustible: carroceriaBase.tapaTanqueCombustible || false,
      estribos: carroceriaBase.estribos || false,
    },
    equipoExt: {
      aireAc: equipoExtBase.aireAc || false,
      vidriosElectricos: equipoExtBase.vidriosElectricos || false,
      bloqueoCentral: equipoExtBase.bloqueoCentral || false,
      espejosElectricos: equipoExtBase.espejosElectricos || false,
      tapetes: equipoExtBase.tapetes || false,
      botiquin: equipoExtBase.botiquin || false,
      kitCarretera: equipoExtBase.kitCarretera || false,
      tapiceriaCuero: equipoExtBase.tapiceriaCuero || false,
      tapiceriaMBTEX: equipoExtBase.tapiceriaMBTEX || false,
      antena: equipoExtBase.antena || false,
      tv: equipoExtBase.tv || false,
      control: equipoExtBase.control || false,
      panelesTecho: equipoExtBase.panelesTecho || false,
    },
    llantas: {
      repuesto: llantasBase.repuesto || false,
      rinesCorrientes: llantasBase.rinesCorrientes || false,
      rinesLujo: llantasBase.rinesLujo || false,
      copas: llantasBase.copas || false,
    },
    fotos: isSalida ? [] : base?.fotos || [],
    observaciones: isSalida ? '' : base?.observaciones || '',
    firmas: {
      entrega: {
        empresa: firmasBase?.entrega?.empresa || '',
        nombre: firmasBase?.entrega?.nombre || '',
        cedula: firmasBase?.entrega?.cedula || '',
        firma: firmasBase?.entrega?.firma || '',
      },
      recibe: {
        empresa: firmasBase?.recibe?.empresa || '',
        nombre: firmasBase?.recibe?.nombre || '',
        cedula: firmasBase?.recibe?.cedula || '',
        firma: firmasBase?.recibe?.firma || '',
      },
      verifica: {
        empresa: firmasBase?.verifica?.empresa || '',
        nombre: firmasBase?.verifica?.nombre || '',
        cedula: firmasBase?.verifica?.cedula || '',
        firma: firmasBase?.verifica?.firma || '',
      },
    },
    accesorios: {
      acc1: accesoriosBase.acc1 || '',
      acc2: accesoriosBase.acc2 || '',
      acc3: accesoriosBase.acc3 || '',
      acc4: accesoriosBase.acc4 || '',
      acc5: accesoriosBase.acc5 || '',
    },
  }
}

export function applyDefaultFirmas(f: FormularioVehiculo, modo: FormMode, supabaseUrl: string): FormularioVehiculo {
  const next: FormularioVehiculo = {
    ...f,
    tipoFormulario: modo,
    firmas: {
      entrega: { ...f.firmas.entrega },
      recibe: { ...f.firmas.recibe },
      verifica: { ...f.firmas.verifica },
    },
  }

  if (modo === 'ingreso') {
    if (!next.firmas.recibe.empresa) next.firmas.recibe.empresa = EMPRESA_VERIFICA
    if (next.firmas.entrega.empresa === EMPRESA_VERIFICA) next.firmas.entrega.empresa = ''
  } else {
    if (!next.firmas.entrega.empresa) next.firmas.entrega.empresa = EMPRESA_VERIFICA
    if (next.firmas.recibe.empresa === EMPRESA_VERIFICA) next.firmas.recibe.empresa = ''
  }

  if (!next.firmas.verifica.empresa) next.firmas.verifica.empresa = EMPRESA_VERIFICA
  if (!next.firmas.verifica.nombre) next.firmas.verifica.nombre = 'Ana María Arango Arboleda'
  if (!next.firmas.verifica.cedula) next.firmas.verifica.cedula = '52440640'
  if (!next.firmas.verifica.firma) next.firmas.verifica.firma = getFirmaVerificaUrl(supabaseUrl)

  return next
}

export function buildSalidaFromIngreso(
  ingreso: FormularioVehiculo,
  numeroFormulario: number,
  supabaseUrl: string,
): FormularioVehiculo {
  const base: Partial<FormularioVehiculo> = {
    ...ingreso,
    numeroFormulario,
    tipoFormulario: 'salida',
    datosGenerales: {
      ...ingreso.datosGenerales,
      fechaSalida: today(),
    },
    firmas: {
      entrega: { ...ingreso.firmas.recibe },
      recibe: { ...ingreso.firmas.entrega },
      verifica: { ...ingreso.firmas.verifica },
    },
  }
  const salida = buildEmptyForm(numeroFormulario, 'salida', base)
  return applyDefaultFirmas(salida, 'salida', supabaseUrl)
}

export function sanitizeForLocalDraft(form: FormularioVehiculo): FormularioVehiculo {
  return {
    ...form,
    fotos: [],
    firmas: {
      ...form.firmas,
      entrega: { ...form.firmas.entrega, firma: '' },
      recibe: { ...form.firmas.recibe, firma: '' },
      verifica: { ...form.firmas.verifica, firma: '' },
    },
  }
}

export function isDraftExpired(savedAt?: number) {
  if (!savedAt || !Number.isFinite(savedAt)) return false
  return Date.now() - savedAt > 24 * 60 * 60 * 1000
}
