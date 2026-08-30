export type FormularioTipo = 'ingreso' | 'salida'

export type FormularioVehiculo = {
  id: string
  numeroFormulario: number
  tipoFormulario: FormularioTipo
  emailDestino?: string
  datosGenerales: {
    fechaIngreso: string
    fechaSalida?: string
    ciudad: string
    marca: string
    chasis: string
    kilometraje: number
    empresa: string
    vendedor: string
    cliente: string
    tipo: string
    fecha: string
  }
  interior: {
    millare: boolean
    guantera: boolean
    tablero: boolean
    asientoConductor: boolean
    asientoDelanteroDerecho: boolean
    asientosPasajeros: boolean
    luzCabina: boolean
    luzPasillo: boolean
    cinturones: number
    radioMarca: boolean
    parlantes: boolean
    parlantesPasillo: boolean
    ceniceros: boolean
    encendedor: boolean
    emblemas: boolean
    panelesPuertas: boolean
    espejoRetrovisor: boolean
    apoyaCabezas: boolean
    manijas: boolean
    pitoSirena: boolean
    espejoslaterales: boolean
    estucheManuales: boolean
    llavesEncendido: number
  }
  motor: {
    encendido: boolean
    varillaAceite: boolean
    tapaAceite: boolean
    combustible: 'Gasolina' | 'ACPM' | 'Hibrido' | 'Eléctrico'
    bateria: {
      voltajeEntrada: number
      voltajeSalida: number
      cambiar: boolean
    }
  }
  equipoCarretera: {
    gato: boolean
    palancaGato: boolean
    crucetaLLavePernos: boolean
    herramientas: boolean
    banderolas: boolean
  }
  vidrios: {
    parabrisasDelantero: boolean
    ventanaDelDer: boolean
    ventanaDelIzq: boolean
    ventanaTraDer: boolean
    ventanaTraIzq: boolean
    parabrisasTrasero: boolean
    ventanasLaterales: boolean
  }
  carroceria: {
    luces: boolean
    direccionalesDel: boolean
    exploradoras: boolean
    cocuyos: boolean
    persiana: boolean
    bomperDel: boolean
    capot: boolean
    limpiabrisas: boolean
    stops: boolean
    tapaTanqueCombustible: boolean
    estribos: boolean
  }
  equipoExt: {
    aireAc: boolean
    vidriosElectricos: boolean
    bloqueoCentral: boolean
    espejosElectricos: boolean
    tapetes: boolean
    botiquin: boolean
    kitCarretera: boolean
    tapiceriaCuero: boolean
    tapiceriaMBTEX: boolean
    antena: boolean
    tv: boolean
    control: boolean
    panelesTecho: boolean
  }
  llantas: {
    repuesto: boolean
    rinesCorrientes: boolean
    rinesLujo: boolean
    copas: boolean
  }
  accesorios: {
    acc1: string
    acc2: string
    acc3: string
    acc4: string
    acc5: string
  }
  fotos: string[]
  observaciones: string
  firmas: {
    entrega: { empresa: string; nombre: string; cedula: string; firma?: string }
    recibe: { empresa: string; nombre: string; cedula: string; firma?: string }
    verifica: { empresa: string; nombre: string; cedula: string; firma?: string }
  }
}
