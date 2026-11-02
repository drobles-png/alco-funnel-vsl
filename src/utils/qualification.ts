// Fuente de verdad del modelo de calificación del funnel de ALCO.
// Sale del cierre del VSL: "en qué zona estás, si ya tienes clientes o vas a empezar
// desde cero, y qué quieres lograr". El filtro real es la intención de invertir:
// un DJI Agras es una inversión alta (ticket promedio ~$23.000).

export interface QuestionOption {
  value: string
  label: string
}

export interface Question {
  key: 'perfil' | 'dron' | 'clientes' | 'zona' | 'inversion'
  title: string
  tagPrefix: string
  noteLabel: string
  options: readonly QuestionOption[]
}

export const QUESTIONS: readonly Question[] = [
  {
    key: 'perfil',
    title: '¿Qué te describe mejor?',
    tagPrefix: 'perfil',
    noteLabel: '🧑‍🌾 Perfil',
    options: [
      { value: 'agronomo', label: 'Estudié agronomía o trabajo en el campo' },
      { value: 'familia_agricultora', label: 'Vengo de una familia de agricultores o tengo finca' },
      { value: 'emprendedor', label: 'Busco un negocio con demanda real' },
      { value: 'ya_fumigo', label: 'Ya doy servicio de fumigación' },
      { value: 'solo_info', label: 'Solo quiero informarme por ahora' },
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
    options: [
      { value: 'ya_tengo', label: 'Sí, ya tengo agricultores que me piden el servicio' },
      { value: 'tengo_contactos', label: 'Tengo contactos, pero aún no clientes' },
      { value: 'desde_cero', label: 'Voy a empezar desde cero' },
    ],
  },
  {
    key: 'zona',
    title: '¿En qué zona estás?',
    tagPrefix: 'zona',
    noteLabel: '📍 Zona',
    options: [
      { value: 'guayas', label: 'Guayas' },
      { value: 'los_rios', label: 'Los Ríos' },
      { value: 'el_oro', label: 'El Oro' },
      { value: 'manabi', label: 'Manabí' },
      { value: 'otra_costa', label: 'Santa Elena, Esmeraldas u otra provincia de la Costa' },
      { value: 'fuera_costa', label: 'Sierra, Oriente o fuera de Ecuador' },
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
  dron: '',
  clientes: '',
  zona: '',
  inversion: '',
})

export function labelFor(key: Question['key'], value: string): string {
  const q = QUESTIONS.find((x) => x.key === key)
  return q?.options.find((o) => o.value === value)?.label ?? value
}

// Se descarta solo a quien viene a informarse sin intención o no tiene cómo invertir.
// La zona y si ya tiene clientes no descalifican: sirven al asesor para armar el camino.
const DISQUALIFYING_PROFILES = new Set(['solo_info'])
const DISQUALIFYING_INVESTMENT = new Set(['sin_presupuesto'])

export const QUALIFIED_TAG = 'lead-calificado-negocio-fumigacion'
export const NURTURE_TAG = 'nutricion-no-califica'
export const QUALIFIED_STATUS = 'qualified_negocio_fumigacion'

export function qualifies(a: Answers): boolean {
  return !DISQUALIFYING_PROFILES.has(a.perfil) && !DISQUALIFYING_INVESTMENT.has(a.inversion)
}
