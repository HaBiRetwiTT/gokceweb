export interface Todo {
  id: number;
  content: string;
}

export interface Meta {
  totalCount: number;
}

export interface DashboardStats {
  ToplamAktifKonaklama?: number;
  SuresiGecentKonaklama?: number;
  BugünCikanKonaklama?: number;
  BugünGirenKonaklama?: number;
  YeniMusteriKonaklama?: number;  // 🔥 Yeni alan
  YeniGirisKonaklama?: number;    // 🔥 Yeni alan
  BorcluMusteriSayisi?: number;
  AlacakliMusteriSayisi?: number;
  ToplamGelir?: number;
}

export interface CustomerRow {
  TC: string;
  musteriAdi: string;
  firma: string;
  telefon: string;
  odaTipi: string;
  odaYatak: string;
  konaklamaTipi: string;
  // ... ihtiyaca göre diğer alanlar
}

export interface EssentialLinkProps {
  title: string;
  caption: string;
  icon: string;
  link?: string;
  action?: string;
}

export interface MusteriKonaklama {
  MstrTCN: string;
  MstrHspTip: string;
  MstrFirma?: string;
  MstrAdi: string;
  MstrTelNo: string;
  KnklmOdaTip: string;
  KnklmOdaNo: string;
  KnklmYtkNo: string;
  KnklmTip: string;
  KnklmNfyt: number;
  KnklmGrsTrh: string;
  KnklmPlnTrh: string;
  KnklmNot?: string;
  KnklmKrLst?: string; // 🚨 Kara Liste Flag
  isKaraListe?: boolean; // Frontend için computed field
  KonaklamaSuresi?: number; // 🔥
  KonaklamaTipi?: string; // 🔥
  HesaplananBedel?: number; // 🔥
  ToplamBedel?: number; // 🔥
  OdemeVadesi?: string; // 🔥
}

export interface BorcluMusteri {
  cKytTarihi: string;
  CariKllnc: string;
  CariKod: string;
  CariAdi: string;
  CariVD?: string;
  CariVTCN?: string;
  CariYetkili?: string;
  CariTelNo?: string;
  MstrFirma?: string;
  MstrHspTip?: string;
  BorcTutari: number;
  OdemeVadesi?: string; // <-- Bunu ekleyin
}

export interface AlacakliMusteri {
  cKytTarihi: string;
  CariKllnc: string;
  CariKod: string;
  CariAdi: string;
  CariVD?: string;
  CariVTCN?: string;
  CariYetkili?: string;
  CariTelNo?: string;
  MstrFirma?: string;
  MstrHspTip?: string;
  AlacakTutari: number;
}

export interface CariHareket {
  iKytTarihi: string;
  islemKllnc: string;
  islemOzel1?: string;
  islemOzel2?: string;
  islemOzel3?: string;
  islemArac?: string;
  islemTip: string;
  islemGrup?: string;
  islemBilgi?: string;
  islemTutar: number;
}

export interface KonaklamaGecmisi {
  kKytTarihi: string;
  KnklmOdaTip: string;
  KnklmOdaNo: string;
  KnklmYtkNo: string;
  KnklmTip: string;
  KnklmNfyt: number;
  KnklmGrsTrh: string;
  KnklmPlnTrh: string;
  KnklmCksTrh?: string;
  KnklmKllnc?: string;
  KnklmLfyt?: string;
  Knklmisk?: string;
  KnklmOdmTkvGun?: string;
  KnklmKrLst?: string;
  KnklmNot?: string;
  knklmNo: number;
}

// 🚨 KARA LİSTE KONTROL RESPONSE
export interface KaraListeKontrolResponse {
  isKaraListe: boolean;
  karaListeNot?: string;
  knklmNo?: number;
}
