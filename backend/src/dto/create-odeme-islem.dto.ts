export class CreateOdemeIslemDto {
  islemler: Array<{
    musteriNo: number;
    MstrTCN?: string; // TC Kimlik No eklendi
    MstrAdi: string;
    islemKllnc: string;
    islemArac: string;
    islemTip: string;
    islemGrup: string;
    islemBilgi: string;
    islemTutar: number;
    MstrHspTip: string;
    MstrKnklmTip: string;
    MstrOdaYatak: string;
    // Diğer alanlar...
  }>;
}
