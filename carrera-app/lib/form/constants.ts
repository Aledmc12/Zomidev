import type { FormularioTipo } from '@/lib/models/FormularioVehiculo'

export type FormMode = FormularioTipo

export const EMPRESA_VERIFICA = 'Carrera Arango SAS'
export const EMAIL_DESTINO_ANA = 'ana.arango@carrera-arango.com'
export const FORM_NUMBER_MIN = 1
/** Número reservado para pruebas — reutilizable, no afecta la numeración real. */
export const FORM_NUMBER_TEST = 0
export const FORM_NUMBER_OPTIONS_COUNT = 120
export const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000
export const FORM_DRAFT_KEY = (mode: FormMode) => `form_vehiculo_draft_${mode}`
export const LAST_INGRESO_KEY = 'form_vehiculo_last_ingreso'
export const PRIVACY_POLICY_URL = 'https://alejdmc.github.io/Politica-de-privacidad.html'

export const CITIES_CO = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Cúcuta',
  'Pereira', 'Manizales', 'Santa Marta', 'Pasto', 'Ibagué', 'Villavicencio', 'Neiva',
  'Montería', 'Sincelejo', 'Valledupar', 'Armenia', 'Tunja', 'Popayán',
]

export const BRANDS = ['DFSK', 'FOTÓN', 'MERCEDES', 'HYUNDAI', 'RENAULT', 'FORD']

export const LOGISTICA_PERSONAS = [
  { nombre: 'VICTOR VILLANUEVA', cedula: '93088360' },
  { nombre: 'JHON CABEZAS', cedula: '80829013' },
]

export const COMBUSTIBLE_OPTIONS = ['Gasolina', 'ACPM', 'Hibrido', 'Eléctrico'] as const

export function getFirmaVerificaUrl(supabaseUrl: string) {
  return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/fotos/firma_verifica.jpeg`
}

export const today = () => new Date().toISOString().slice(0, 10)

export function isProductionFormNumber(n: number): boolean {
  return Number.isFinite(n) && n >= FORM_NUMBER_MIN
}

export function isTestFormNumber(n: number): boolean {
  return Number.isFinite(n) && n === FORM_NUMBER_TEST
}

export function isReusableTestFormNumber(n: number): boolean {
  return isTestFormNumber(n)
}

export function isValidFormNumber(n: number): boolean {
  return isProductionFormNumber(n) || isTestFormNumber(n)
}

export type BoolFieldDef = { key: string; label: string }

export const INTERIOR_BOOL_FIELDS: BoolFieldDef[] = [
  { key: 'millare', label: 'Millare' },
  { key: 'guantera', label: 'Guantera' },
  { key: 'tablero', label: 'Tablero' },
  { key: 'asientoConductor', label: 'Asiento Conductor' },
  { key: 'asientoDelanteroDerecho', label: 'Asiento Delantero Derecho' },
  { key: 'asientosPasajeros', label: 'Asientos Pasajeros' },
  { key: 'luzCabina', label: 'Luz Cabina' },
  { key: 'luzPasillo', label: 'Luz Pasillo' },
  { key: 'radioMarca', label: 'Radio/Marca' },
  { key: 'parlantes', label: 'Parlantes' },
  { key: 'parlantesPasillo', label: 'Parlantes Pasillo' },
  { key: 'ceniceros', label: 'Ceniceros' },
  { key: 'encendedor', label: 'Encendedor' },
  { key: 'emblemas', label: 'Emblemas' },
  { key: 'panelesPuertas', label: 'Paneles Puertas' },
  { key: 'espejoRetrovisor', label: 'Espejo Retrovisor' },
  { key: 'apoyaCabezas', label: 'Apoya Cabezas' },
  { key: 'manijas', label: 'Manijas' },
  { key: 'pitoSirena', label: 'Pito/Sirena' },
  { key: 'espejoslaterales', label: 'Espejos Laterales' },
  { key: 'estucheManuales', label: 'Estuche Manuales' },
]

export const MOTOR_BOOL_FIELDS: BoolFieldDef[] = [
  { key: 'encendido', label: 'Encendido' },
  { key: 'varillaAceite', label: 'Varilla Aceite' },
  { key: 'tapaAceite', label: 'Tapa Aceite' },
]

export const EQUIPO_CARRETERA_FIELDS: BoolFieldDef[] = [
  { key: 'gato', label: 'Gato' },
  { key: 'palancaGato', label: 'Palanca Gato' },
  { key: 'crucetaLLavePernos', label: 'Cruceta/Llave Pernos' },
  { key: 'herramientas', label: 'Herramientas' },
  { key: 'banderolas', label: 'Banderolas' },
]

export const VIDRIOS_FIELDS: BoolFieldDef[] = [
  { key: 'parabrisasDelantero', label: 'Parabrisas Delantero' },
  { key: 'ventanaDelDer', label: 'Ventana Del. Der.' },
  { key: 'ventanaDelIzq', label: 'Ventana Del. Izq.' },
  { key: 'ventanaTraDer', label: 'Ventana Tra. Der.' },
  { key: 'ventanaTraIzq', label: 'Ventana Tra. Izq.' },
  { key: 'parabrisasTrasero', label: 'Parabrisas Trasero' },
  { key: 'ventanasLaterales', label: 'Ventanas Laterales' },
]

export const CARROCERIA_FIELDS: BoolFieldDef[] = [
  { key: 'luces', label: 'Luces' },
  { key: 'direccionalesDel', label: 'Direccionales Del.' },
  { key: 'exploradoras', label: 'Exploradoras' },
  { key: 'cocuyos', label: 'Cocuyos' },
  { key: 'persiana', label: 'Persiana' },
  { key: 'bomperDel', label: 'Bomper Del.' },
  { key: 'capot', label: 'Capot' },
  { key: 'limpiabrisas', label: 'Limpiabrisas' },
  { key: 'stops', label: 'Stops' },
  { key: 'tapaTanqueCombustible', label: 'Tapa Tanque Combustible' },
  { key: 'estribos', label: 'Estribos' },
]

export const EQUIPO_EXT_FIELDS: BoolFieldDef[] = [
  { key: 'aireAc', label: 'Aire A/C' },
  { key: 'vidriosElectricos', label: 'Vidrios Eléctricos' },
  { key: 'bloqueoCentral', label: 'Bloqueo Central' },
  { key: 'espejosElectricos', label: 'Espejos Eléctricos' },
  { key: 'tapetes', label: 'Tapetes' },
  { key: 'botiquin', label: 'Botiquín' },
  { key: 'kitCarretera', label: 'Kit Carretera' },
  { key: 'tapiceriaCuero', label: 'Tapicería Cuero' },
  { key: 'tapiceriaMBTEX', label: 'Tapicería MBTEX' },
  { key: 'antena', label: 'Antena' },
  { key: 'tv', label: 'TV' },
  { key: 'control', label: 'Control' },
  { key: 'panelesTecho', label: 'Paneles Techo' },
]

export const LLANTAS_FIELDS: BoolFieldDef[] = [
  { key: 'repuesto', label: 'Repuesto' },
  { key: 'rinesCorrientes', label: 'Rines Corrientes' },
  { key: 'rinesLujo', label: 'Rines Lujo' },
  { key: 'copas', label: 'Copas' },
]
