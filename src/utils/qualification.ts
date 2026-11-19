// Fuente de verdad del modelo de calificación del funnel de ALCO.
// Sale del cierre del VSL y de lo que pidió ALCO (perfil productor/prestador, cultivo, provincia
// y cantón). El filtro real es la intención de invertir:
// un DJI Agras es una inversión alta (ticket promedio ~$23.000).

export interface QuestionOption {
  value: string
  label: string
}

export interface Question {
  key: 'perfil' | 'cultivo' | 'dron' | 'clientes' | 'inversion'
  title: string
  tagPrefix: string
  noteLabel: string
  options: readonly QuestionOption[]
  /** Si existe, la pregunta solo aparece cuando devuelve true (según lo ya respondido). */
  showIf?: (a: Answers) => boolean
}

const esProductor = (a: Answers) => a.perfil === 'productor' || a.perfil === 'ambos'
const esPrestador = (a: Answers) => a.perfil === 'prestador' || a.perfil === 'ambos'

export const QUESTIONS: readonly Question[] = [
  {
    key: 'perfil',
    title: '¿Qué te describe mejor?',
    tagPrefix: 'perfil',
    noteLabel: '🧑‍🌾 Perfil',
    options: [
      { value: 'productor', label: 'Productor: tengo finca o cultivo' },
      { value: 'prestador', label: 'Prestador de servicios de fumigación' },
      { value: 'ambos', label: 'Ambos' },
    ],
  },
  {
    key: 'cultivo',
    title: '¿Cuál es tu cultivo principal?',
    tagPrefix: 'cultivo',
    noteLabel: '🌱 Cultivo',
    showIf: esProductor,
    options: [
      { value: 'banano', label: 'Banano' },
      { value: 'cacao', label: 'Cacao' },
      { value: 'arroz', label: 'Arroz' },
      { value: 'maiz', label: 'Maíz' },
      { value: 'palma', label: 'Palma africana' },
      { value: 'cana', label: 'Caña de azúcar' },
      { value: 'otro', label: 'Otro' },
    ],
  },
  {
    key: 'dron',
    title: '¿Ya tienes un dron de fumigación?',
    tagPrefix: 'dron',
    noteLabel: '🚁 Dron',
    options: [
      { value: 'no_tengo', label: 'No, todavía no tengo' },
      { value: 'tengo_dji', label: 'Sí, tengo un DJI Agras' },
      { value: 'tengo_otra', label: 'Sí, de otra marca' },
    ],
  },
  {
    key: 'clientes',
    title: '¿Ya tienes clientes para fumigar?',
    tagPrefix: 'clientes',
    noteLabel: '🤝 Clientes',
    showIf: esPrestador,
    options: [
      { value: 'ya_tengo', label: 'Sí, ya tengo agricultores que me piden el servicio' },
      { value: 'tengo_contactos', label: 'Tengo contactos, pero aún no clientes' },
      { value: 'desde_cero', label: 'Voy a empezar desde cero' },
    ],
  },
  {
    key: 'inversion',
    title: '¿Cómo piensas invertir en tu equipo?',
    tagPrefix: 'inversion',
    noteLabel: '💰 Inversión',
    options: [
      { value: 'contado', label: 'Tengo el capital para invertir' },
      { value: 'financiamiento', label: 'Con crédito o financiamiento' },
      { value: 'socio', label: 'Con un socio o mi familia' },
      { value: 'sin_presupuesto', label: 'Por ahora no tengo cómo invertir' },
    ],
  },
] as const

export type Answers = Record<Question['key'], string>

export const emptyAnswers = (): Answers => ({
  perfil: '',
  cultivo: '',
  dron: '',
  clientes: '',
  inversion: '',
})

/** Preguntas que le tocan a esta persona según lo que ya respondió. */
export const activeQuestions = (a: Answers) => QUESTIONS.filter((q) => !q.showIf || q.showIf(a))

export function labelFor(key: Question['key'], value: string): string {
  const q = QUESTIONS.find((x) => x.key === key)
  return q?.options.find((o) => o.value === value)?.label ?? value
}

// ── Provincia (se pide en el registro) ──────────────────────────────────────
// La zona ya no se pregunta: se calcula de la provincia y se sigue mandando como `zona`/`zona_label`
// porque el workflow de GHL ya la mapea.
export const PROVINCIAS: readonly QuestionOption[] = [
  { value: 'azuay', label: 'Azuay' },
  { value: 'bolivar', label: 'Bolívar' },
  { value: 'canar', label: 'Cañar' },
  { value: 'carchi', label: 'Carchi' },
  { value: 'chimborazo', label: 'Chimborazo' },
  { value: 'cotopaxi', label: 'Cotopaxi' },
  { value: 'el_oro', label: 'El Oro' },
  { value: 'esmeraldas', label: 'Esmeraldas' },
  { value: 'galapagos', label: 'Galápagos' },
  { value: 'guayas', label: 'Guayas' },
  { value: 'imbabura', label: 'Imbabura' },
  { value: 'loja', label: 'Loja' },
  { value: 'los_rios', label: 'Los Ríos' },
  { value: 'manabi', label: 'Manabí' },
  { value: 'morona_santiago', label: 'Morona Santiago' },
  { value: 'napo', label: 'Napo' },
  { value: 'orellana', label: 'Orellana' },
  { value: 'pastaza', label: 'Pastaza' },
  { value: 'pichincha', label: 'Pichincha' },
  { value: 'santa_elena', label: 'Santa Elena' },
  { value: 'santo_domingo', label: 'Santo Domingo de los Tsáchilas' },
  { value: 'sucumbios', label: 'Sucumbíos' },
  { value: 'tungurahua', label: 'Tungurahua' },
  { value: 'zamora_chinchipe', label: 'Zamora Chinchipe' },
  { value: 'fuera_ecuador', label: 'Estoy fuera de Ecuador' },
]

export const provinciaLabel = (value: string) =>
  PROVINCIAS.find((p) => p.value === value)?.label ?? ''

const ZONA_LABELS: Record<string, string> = {
  guayas: 'Guayas',
  los_rios: 'Los Ríos',
  el_oro: 'El Oro',
  manabi: 'Manabí',
  otra_costa: 'Santa Elena, Esmeraldas u otra provincia de la Costa',
  fuera_costa: 'Sierra, Oriente o fuera de Ecuador',
}
const OTRA_COSTA = new Set(['santa_elena', 'esmeraldas', 'santo_domingo'])

/** Zona (valores de la pregunta vieja) a partir de la provincia. Vacía si no hay provincia. */
export function zonaFromProvincia(provincia: string): { zona: string; zona_label: string } {
  if (!provincia) return { zona: '', zona_label: '' }
  const zona = ZONA_LABELS[provincia] ? provincia : OTRA_COSTA.has(provincia) ? 'otra_costa' : 'fuera_costa'
  return { zona, zona_label: ZONA_LABELS[zona]! }
}

// Se descarta solo a quien no tiene cómo invertir. Perfil, cultivo, provincia y clientes no
// descalifican: productor y prestador agendan igual (ALCO vende el dron a los dos).
const DISQUALIFYING_INVESTMENT = new Set(['sin_presupuesto'])

export const QUALIFIED_TAG = 'lead-calificado-negocio-fumigacion'
export const NURTURE_TAG = 'nutricion-no-califica'
export const QUALIFIED_STATUS = 'qualified_negocio_fumigacion'

export function qualifies(a: Answers): boolean {
  return !DISQUALIFYING_INVESTMENT.has(a.inversion)
}
