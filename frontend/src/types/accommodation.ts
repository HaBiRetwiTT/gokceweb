// Accommodation Types Interface
export interface AccommodationType {
  id: number
  value: string
  label: string
  icon: string
  color: string
}

// Accommodation Selection Event Interface
export interface AccommodationSelectionEvent {
  selected: string[]
  labels: string[]
}

// Dashboard Filter Interface
export interface DashboardFilter {
  accommodationTypes: string[]
  dateRange?: {
    from: Date
    to: Date
  }
  status?: 'active' | 'inactive' | 'all'
}

// Dashboard Customer Data Interface
export interface DashboardCustomerData {
  MstrNo?: number
  MstrTCN?: string
  MstrAdi?: string
  MstrTelNo?: string
  MstrFirma?: string
  KnklmTip?: string
  KnklmOdaTip?: string
  KnklmOdaNo?: string | number
  KnklmYtkNo?: string | number
  KnklmGrsTrh?: string
  KnklmCksTrh?: string
  KnklmNot?: string
  [key: string]: unknown // For additional dynamic properties
}

// Dashboard Data Response Interface
export interface DashboardResponse {
  success: boolean
  data: DashboardCustomerData[]
  count: number
  tip?: string
  total?: number
  page?: number
  limit?: number
}

// Accommodation Type Constants
export const ACCOMMODATION_TYPES: AccommodationType[] = [
  {
    id: 1,
    value: 'GUNLUK',
    label: 'GÜNLÜK',
    icon: 'today',
    color: 'orange'
  },
  {
    id: 2,
    value: 'HAFTALIK',
    label: 'HAFTALIK',
    icon: 'date_range',
    color: 'blue'
  },
  {
    id: 3,
    value: 'AYLIK',
    label: 'AYLIK',
    icon: 'calendar_month',
    color: 'green'
  }
]

// Room Type Constants
export const ROOM_TYPES: AccommodationType[] = [
  {
    id: 1,
    value: 'TEK_KISILIK',
    label: 'Tek Kişilik',
    icon: 'person',
    color: 'blue'
  },
  {
    id: 2,
    value: 'IKI_KISILIK',
    label: '2 Kişilik',
    icon: 'group',
    color: 'green'
  },
  {
    id: 3,
    value: 'DORT_KISILIK',
    label: '4 Kişilik',
    icon: 'groups',
    color: 'purple'
  },
  {
    id: 4,
    value: 'DORMITORY',
    label: 'Dormitory',
    icon: 'apartment',
    color: 'orange'
  },
  {
    id: 5,
    value: 'CAMSIZ',
    label: 'Camsız',
    icon: '',
    color: 'grey'
  },
  {
    id: 6,
    value: 'CAMLI',
    label: 'Camlı',
    icon: 'window',
    color: 'light-blue'
  },
  {
    id: 7,
    value: 'A_TIPI',
    label: '(A) Tipi',
    icon: 'star',
    color: 'yellow'
  },
  {
    id: 8,
    value: 'TV_LUKS',
    label: '+TV Lüks',
    icon: 'tv',
    color: 'red'
  }
]