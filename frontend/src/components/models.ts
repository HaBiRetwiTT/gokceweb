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
  DevamEdenKonaklama?: number;    // 🔥 Yeni alan
  SuresiDolanKonaklama?: number;  // 🔥 Yeni alan
  BugünCikanKonaklama?: number;
  BugünGirenKonaklama?: number;
  YeniMusteriKonaklama?: number;  // 🔥 Yeni alan
  YeniGirisKonaklama?: number;    // 🔥 Yeni alan
  BorcluMusteriSayisi?: number;
  AlacakliMusteriSayisi?: number;
  BakiyesizHesaplarSayisi?: number; // 🔥 Yeni alan
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
  CikisTarihi?: string; // 🔥 Çıkış tarihi - en büyük knklmNo kaydından
  KnklmCksTrh?: string; // 🔥 Orijinal çıkış tarihi
  KnklmPlnTrh?: string; // 🔥 Orijinal planlanan tarih
  MstrDurum?: string; // 🔥 Müşteri durumu - en büyük knklmNo kaydından
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
  CikisTarihi?: string; // 🔥 Çıkış tarihi - en büyük knklmNo kaydından
  KnklmCksTrh?: string; // 🔥 Orijinal çıkış tarihi
  KnklmPlnTrh?: string; // 🔥 Orijinal planlanan tarih
  MstrDurum?: string; // 🔥 Müşteri durumu - en büyük knklmNo kaydından
}

export interface BakiyesizHesaplar {
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
  BorcTutari: number; // Bakiyesiz hesaplarda her zaman 0 olacak
  CikisTarihi?: string; // 🔥 Çıkış tarihi - en büyük knklmNo kaydından
  KnklmCksTrh?: string; // 🔥 Orijinal çıkış tarihi
  KnklmPlnTrh?: string; // 🔥 Orijinal planlanan tarih
  MstrDurum?: string; // 🔥 Müşteri durumu - en büyük knklmNo kaydından
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
