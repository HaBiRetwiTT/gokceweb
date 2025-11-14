import { Notify } from 'quasar'

// Ödeme tipleri
const odemeTipleri = [
  { label: 'Nakit Kasa(TL)', value: 'nakit' },
  { label: 'Kredi Kartları', value: 'kredi' },
  { label: 'Banka EFT', value: 'banka' }
]

// Tutar formatlama fonksiyonu
function formatCurrency(value: number | undefined | string | null): string {
  if (value === null || value === undefined || value === '') return '0 ₺'
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(numValue)) {
    return '0 ₺'
  }
  
  const roundedValue = Math.round(numValue * 100) / 100
  
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(roundedValue)
}

// Tek fiş yazdırma fonksiyonu - tüm ödemeler tek fişte
export async function printSingleFis(
  odemeler: Array<{ tutar: string | number; tip: string; odemeTipiGrup: string; komisyon?: boolean; orijinalTutar?: string | number; ekHizmetNotu?: string }>,
  musteri: { 
    MstrAdi?: string; 
    OdaYatak?: string; 
    KnklmOdaNo?: string; 
    KnklmYtkNo?: string; 
    MstrNo?: number; 
    MstrTCN?: string; 
    CariKod?: string;
    KnklmPlnTrh?: string;
    MstrHspTip?: string;
  },
  islemKllnc: string,
  fisNo: number,
  depozitoAlinan?: number,
  depozitoOdemeAraci?: string,
  yeniEklenenGelirToplami?: number,
  formBaslikKalanBakiye?: number
) {
  console.log('🖨️ Tek fiş yazdırma başlıyor...');
  
  // Form başlığından gelen kalan bakiyeyi kullan
  const kalanBorc = formBaslikKalanBakiye !== undefined ? formBaslikKalanBakiye : 0;
  console.log(`💰 Form başlığından kalan bakiye: ${kalanBorc}`);
  
  // Ödeme satırlarını oluştur
  let odemeSatirlari = '';
  for (let i = 0; i < odemeler.length; i++) {
    const od = odemeler[i];
    const odemeTipiLabel = odemeTipleri.find(tip => tip.value === od.tip)?.label || 'Nakit Kasa(TL)';
    
    odemeSatirlari += `
      <div style="margin-bottom: 2mm;">
        <div style="border: 3px solid #000; padding: 2mm; display: flex; justify-content: space-between; align-items: center; background: white; font-weight: 900; font-size: 3.5mm;">
          <span>${odemeTipiLabel}</span>
          <span>-</span>
          <span style="font-family: 'Arial Black', Arial, sans-serif;">₺${od.tutar}</span>
        </div>
      </div>
    `;
  }
  
  // Depozito satırı
  let depozitoSatiri = '';
  if (depozitoAlinan && depozitoOdemeAraci) {
    depozitoSatiri = `
      <div style="margin-bottom: 2mm;">
        <div style="border: 3px solid #000; padding: 2mm; background: #fffacd;">
          <div style="font-weight: 900; font-size: 2.8mm; margin-bottom: 1mm; text-align: center;">DEPOZİTO</div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 900; font-size: 3.5mm;">
            <span>${depozitoOdemeAraci}</span>
            <span>-</span>
            <span style="font-family: 'Arial Black', Arial, sans-serif;">₺${depozitoAlinan}</span>
          </div>
        </div>
      </div>
    `;
  }
  
  // Fiş HTML - mevcut koddan üst kısımları alıp yeni yapıyla birleştir
  const tarih = new Date().toLocaleDateString('tr-TR');
  const musteriAdi = musteri.MstrAdi || 'Bilinmeyen Müşteri';
  const odaBilgisi = musteri.OdaYatak || (musteri.KnklmOdaNo && musteri.KnklmYtkNo ? `${musteri.KnklmOdaNo} - ${musteri.KnklmYtkNo}` : '');
  const planlananCikis = musteri.KnklmPlnTrh || tarih;
    
    // TEK FİŞ HTML'ini oluştur
    const fisHTML = `
      <div class="fis-container">
        
        <!-- Üst Bilgi Satırı -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2mm; font-size: 2.4mm; font-weight: 900;">
          <span>TARİH: ${tarih}</span>
          <span>İŞLEMİ YAPAN: ${islemKllnc}</span>
          <span>FİŞ NO: ${fisNo}</span>
        </div>
        
        <!-- Logo ve Firma Adı -->
        <div style="display: flex; align-items: center; margin-bottom: 3mm;">
          <div style="width: 12mm; height: 12mm; display: flex; align-items: center; justify-content: center; margin-right: 2mm;">
            <img src="/gokce-logo.png" style="width: 10mm; height: 10mm; object-fit: contain;" />
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 900; font-size: 4.7mm; text-align: center; margin-bottom: 0.5mm; font-family: 'Arial Black', Arial, sans-serif;">GÖKÇE PANSİYON®</div>
            <div style="font-size: 2.4mm; text-align: center; font-style: italic; font-weight: 900;">İstanbul'daki Eviniz</div>
          </div>
        </div>
        
        <!-- Tahsilat Makbuzu Başlığı -->
        <div style="border: 3px solid #000; background: #f0f0f0; padding: 2mm; margin-bottom: 3mm; text-align: center;">
          <div style="font-weight: 900; font-size: 4.2mm; text-transform: uppercase; font-family: 'Arial Black', Arial, sans-serif;">TAHSİLAT MAKBUZU</div>
        </div>
        
        <!-- Müşteri Bilgileri -->
        <div style="margin-bottom: 2mm; display: flex; align-items: center;">
          <span style="font-weight: 900; font-size: 3mm; display: inline-block; width: 10mm;">SAYIN</span>
          <div style="border: 3px solid #000; padding: 1.5mm; flex: 1; font-weight: 900; font-size: 3.3mm; display: flex; align-items: center; justify-content: center; background: white; font-family: 'Arial Black', Arial, sans-serif;">${musteriAdi}</div>
        </div>
        
        <!-- Oda Bilgileri -->
        <div style="margin-bottom: 2mm; display: flex; align-items: center;">
          <span style="font-weight: 900; font-size: 3mm; display: inline-block; width: 10mm;">ODA</span>
          <div style="border: 3px solid #000; padding: 1.5mm; flex: 1; font-weight: 900; font-size: 3.3mm; display: flex; align-items: center; justify-content: center; background: white;">${odaBilgisi}</div>
        </div>
        
        <!-- Ödeme Satırları -->
        ${odemeSatirlari}
        
        <!-- Depozito Satırı -->
        ${depozitoSatiri}
        
        <!-- Kalan Borç -->
        <div style="margin-bottom: 2mm;">
          <div style="border: 3px solid #000; padding: 2mm; display: flex; justify-content: space-between; align-items: center; background: white; font-weight: 900; font-size: 3.5mm;">
            <span>KALAN BORÇ</span>
            <span>-</span>
            <span style="font-family: 'Arial Black', Arial, sans-serif;">${formatCurrency(kalanBorc)}</span>
          </div>
        </div>
        
        <!-- Planlanan Çıkış -->
        <div style="margin-bottom: 2mm;">
          <div style="border: 3px solid #000; padding: 2mm; text-align: center; background: white; font-weight: 900; font-size: 3mm;">
            <div>PLANLANAN ÇIKIŞ</div>
            <div style="font-size: 3.3mm; margin-top: 1mm; font-family: 'Arial Black', Arial, sans-serif;">${planlananCikis}</div>
          </div>
        </div>
        
        <!-- Bilgilendirme Kutusu -->
        <div style="border: 3px solid #000; background: #f0f0f0; padding: 2mm; margin-bottom: 2mm;">
          <div style="font-weight: 900; font-size: 3mm; text-align: center; margin-bottom: 1.5mm;">BİLGİLENDİRME</div>
          <div style="font-size: 2.2mm; line-height: 1.3; font-weight: 900;">
            <div>WIFI ŞİFRESİ: GOKCE2010gokce</div>
            <div>GÜNLÜK KALIMLARDA ODA ÇIKIŞ SAATİ ÖĞLEN 12:00</div>
            <div>LÜTFEN FİŞİ VE PARANIZI KONTROL EDEREK ALINIZ</div>
            <div>BU BELGENİN MALİ BİR DEĞERİ YOKTUR</div>
          </div>
          
          <div style="text-align: center; margin-top: 2mm;">
            <div style="font-weight: 900; font-size: 2.4mm;">DAHA İYİ HİZMET VEREBİLMEMİZ İÇİN</div>
            <div style="font-weight: 900; font-size: 2.4mm;">İSTEK, ÖNERİ VE ŞİKAYETLERİNİZİ</div>
            <div style="font-weight: 900; font-size: 2.4mm;">LÜTFEN BİZE İLETİNİZ...</div>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-top: 2mm; font-size: 2mm; font-weight: 900;">
            <div>
              <div>TEL: 0 (212) 296 66 60</div>
              <div>GSM: 0 (545) 296 66 60</div>
            </div>
            <div style="text-align: right;">
              <div>MAIL: bilgi@gokcepansiyon.com</div>
              <div>WEB: www.gokcepansiyon.com</div>
            </div>
          </div>
        </div>
        
        <!-- Alt Çizgi -->
        <div style="background: #000; color: white; text-align: center; padding: 1mm; font-size: 2mm; font-weight: 900;">
          ${fisNo}
        </div>
      </div>
    `;
  
  // Tek fiş yazdır
  return new Promise<void>((resolve, reject) => {
    try {
      const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Müşteri Tahsilat Fişi - ${fisNo}</title>
              <style>
                @page {
                  size: 78mm 142mm;
                  margin: 0;
                  padding: 0;
                }
                body {
                  margin: 0;
                  padding: 0;
                  background: white;
                  font-family: Arial, sans-serif;
                }
                .fis-container {
                  width: 78mm;
                  height: 142mm;
                  margin: 0;
                  padding: 2mm;
                  background: white;
                  box-sizing: border-box;
                  font-family: Arial, sans-serif;
                  font-size: 2.2mm;
                  line-height: 1.2;
                  color: black;
                  page-break-after: always;
                }
                .fis-container:last-child {
                  page-break-after: avoid;
                }
                @media print {
                  .fis-container {
                    width: 78mm !important;
                    height: 142mm !important;
                    transform: none !important;
                    scale: 1 !important;
                    page-break-after: always !important;
                  }
                  .fis-container:last-child {
                    page-break-after: avoid !important;
                  }
                  * {
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                  }
                  body {
                    font-weight: bolder !important;
                  }
                }
              </style>
            </head>
            <body>
              ${fisHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            console.log(`✅ Tek fiş yazdırma başlatıldı`);
            
            setTimeout(() => {
              printWindow.close();
              console.log('🔒 Fiş yazdırma penceresi kapatıldı');
              resolve();
            }, 3000);
          }, 500);
        };
      } else {
        reject(new Error('Yeni pencere açılamadı'));
      }
    } catch (error) {
      console.error('❌ Tek fiş yazdırma hatası:', error);
      Notify.create({ type: 'negative', message: 'Fiş yazdırma hatası: ' + String(error) });
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

