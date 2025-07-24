# 🔒 TRANSACTION SAFETY CHECKLIST

## 🚨 CRITICAL MISSION: PREVENT DATA INTEGRITY FAILURES

Bu dokümantasyon, **veri bütünlüğü koruma** ve **transaction güvenliği** için kritik gereksinimlerini tanımlar. **Bu kuralların ihlali veri kaybına, gelir kaybına ve sistem arızalarına neden olabilir.**

---

## ⚠️ RİSK ANALİZİ: NEDEN TRANSACTION GÜVENLİĞİ KRİTİKTİR?

### **Potansiyel Felaket Senaryoları:**

#### **💥 Senaryo 1: Müşteri Kaydı Yarı Tamamlandı**
```
✅ tblMusteri kaydı oluşturuldu
❌ tblCari kaydı oluşturulamadı (network failure)
❌ tblKonaklama kaydı oluşturulamadı
❌ tblOdaYatak durumu güncellenmedi
❌ tblislem finansal kaydı oluşturulamadı

SONUÇ: Müşteri var ama hesabı yok, konaklama kaydı yok, oda hala boş görünüyor!
```

#### **💥 Senaryo 2: Oda Değişikliği Yarı Tamamlandı**
```
✅ tblKonaklama kaydı güncellendi (yeni oda bilgisi)
✅ Eski oda BOŞ yapıldı
❌ Yeni oda DOLU yapılamadı (server crash)
❌ İşlem kaydı oluşturulamadı

SONUÇ: Müşteri yeni odada gözüküyor, ama yeni oda hala BOŞ!
```

#### **💥 Senaryo 3: Çıkış İşlemi Yarı Tamamlandı**
```
✅ Konaklama sonlandırıldı
✅ Müşteri durumu AYRILDI yapıldı
❌ Oda-yatak BOŞ yapılamadı (connection timeout)

SONUÇ: Müşteri ayrılmış ama oda hala DOLU görünüyor!
```

### **📊 İş Etkisi:**
- **💰 Gelir Kaybı**: Ödeme alınan bilgilerin kaydı eksik
- **🏠 Oda Çakışmaları**: Aynı oda birden fazla müşteriye verilir
- **💳 Finansal Tutarsızlıklar**: Para akışı ile konaklama kayıtları uyumsuz
- **📈 Raporlama Hataları**: Yanlış doluluk oranları ve gelir raporları
- **👥 Müşteri Memnuniyetsizliği**: Oda bulunamama ve overbooking

---

## ✅ TRANSACTION SAFETY CHECKLIST

### **📋 ENDPOINT GELİŞTİRME KONTROL LİSTESİ**

Yeni bir endpoint geliştirirken veya mevcut endpoint'i güncellerken bu checklist'i kullanın:

#### **🔍 1. OPERATION ANALYSIS**
- [ ] Bu endpoint kaç adet database tablosunu değiştiriyor?
- [ ] Bu operasyon stored procedure + ORM + direct query karışımı mı?
- [ ] Network failure durumunda hangi tablolar tutarsız kalabilir?
- [ ] Yarı tamamlanan operasyon business logic'i nasıl bozar?

#### **🏗️ 2. ARCHITECTURE REQUIREMENTS**
- [ ] Endpoint birden fazla tablo güncelliyorsa `DatabaseTransactionService` kullanıldı mı?
- [ ] Controller'da `transactionService.executeInTransaction()` wrapper kullanıldı mı?
- [ ] Service metodlarında `WithTransaction` versiyonları oluşturuldu mu?
- [ ] Backward compatibility için eski metodlar korundu mu?

#### **🔧 3. IMPLEMENTATION VERIFICATION**
- [ ] Tüm database operasyonları `queryRunner` parametresi ile çalışıyor mu?
- [ ] Error handling transaction rollback'i açıkça bildiriyor mu?
- [ ] Success mesajları tüm operasyonların güvenli tamamlandığını belirtiyor mu?
- [ ] Linting hatalarında `any` type'lar için ESLint disable eklendi mi?

#### **🧪 4. TESTING REQUIREMENTS**
- [ ] Network interruption simülasyonu ile test edildi mi?
- [ ] Partial completion senaryoları test edildi mi?
- [ ] Rollback işlevi doğru çalışıyor mu?
- [ ] Error mesajları kullanıcı dostu ve bilgilendirici mi?

---

## 🛠️ IMPLEMENTATION TEMPLATES

### **Template 1: Controller Transaction Wrapper**
```typescript
@Post('your-endpoint')
async yourEndpoint(@Body() data: any) {
  try {
    console.log('=== your-endpoint called (Transaction-Safe) ===');
    
    // 🔒 TRANSACTION İÇİNDE TÜM İŞLEMLERİ GÜVENLİ ÇALIŞTIR
    const result = await this.transactionService.executeInTransaction(async (queryRunner) => {
      // Tüm operasyonlar başarılı olmalı, yoksa hepsi geri alınır
      const step1 = await this.service.operation1WithTransaction(queryRunner, data);
      const step2 = await this.service.operation2WithTransaction(queryRunner, data, step1.result);
      const step3 = await this.service.operation3WithTransaction(queryRunner, data, step2.result);
      
      return { step1, step2, step3 };
    });
    
    return { 
      success: true, 
      message: '✅ Tüm işlemler güvenli şekilde tamamlandı',
      data: result 
    };
  } catch (error) {
    console.error('Transaction hatası:', error);
    return { 
      success: false, 
      message: '❌ Veri güvenliği nedeniyle hiçbir değişiklik kaydedilmedi',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    };
  }
}
```

### **Template 2: Service Transaction Method**
```typescript
async yourOperationWithTransaction(
  queryRunner: QueryRunner,
  data: YourDataType
): Promise<YourResultType> {
  try {
    console.log('=== yourOperationWithTransaction başlatıldı ===');
    
    // Stored procedure çalıştırma
    const spResult = await this.transactionService.executeStoredProcedure(
      queryRunner,
      'your_stored_procedure',
      [param1, param2, param3]
    );
    
    // Direct query çalıştırma
    const queryResult = await this.transactionService.executeQuery(
      queryRunner,
      'UPDATE table SET column = @0 WHERE id = @1',
      [newValue, recordId]
    );
    
    console.log('=== yourOperationWithTransaction tamamlandı (Transaction-Safe) ===');
    return { success: true, data: spResult };
  } catch (error) {
    console.error('yourOperationWithTransaction hatası:', error);
    throw new Error(`Operation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
```

---

## 📊 TRANSACTION SAFETY MATRIX

| Endpoint | Tables Modified | Transaction Status | Risk Level |
|----------|----------------|-------------------|------------|
| `/musteri-islem` | 5 (tblMusteri, tblCari, tblKonaklama, tblOdaYatak, tblislem) | ✅ Protected | 🔴 Critical |
| `/donem-yenileme` | 3 (tblKonaklama x2, tblOdaYatak, tblislem) | ✅ Protected | 🔴 Critical |
| `/cikis-yap` | 3 (tblKonaklama, tblOdaYatak, tblMusteri) | ✅ Protected | 🟡 High |
| `/direkt-oda-degisikligi` | 3 (tblKonaklama, tblOdaYatak, tblislem) | ✅ Protected | 🟡 High |

---

## 🚀 FUTURE DEVELOPMENT GUIDELINES

### **Yeni Endpoint Eklerken:**
1. **Multi-table operation var mı?** → Transaction service kullan
2. **Business-critical operation mı?** → Transaction safety zorunlu
3. **Financial data involved mı?** → Extra validation + transaction
4. **Room/bed management var mı?** → Concurrency protection gerekli

### **Mevcut Endpoint Güncellerken:**
1. **Operation sayısı artıyor mu?** → Transaction safety ekle
2. **Yeni tablo ekleniyor mu?** → Transaction wrapper güncelle
3. **Performance optimization yapıyorsan** → Transaction integrity koruma
4. **Bug fix yapıyorsan** → Data integrity riski var mı kontrol et

### **Code Review Kriterleri:**
- [ ] Multi-step operations transaction-safe mi?
- [ ] Error handling explicit rollback messaging var mı?
- [ ] User feedback data integrity'yi vurguluyor mu?
- [ ] Backward compatibility korunuyor mu?

---

## 🎯 ÖNEMLİ NOTLAR

### **Püf Noktaları:**
- **QueryRunner Usage**: Tüm transaction metodları `queryRunner` parametresi almalı
- **ESLint Disable**: TypeORM'dan gelen `any` types için `// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment` kullan
- **Error Propagation**: Service katmanında fırlatılan hatalar controller'da yakalanmalı
- **User Messaging**: Error mesajları technical details yerine business impact'i vurgulamalı

### **Performance Considerations:**
- Transaction overhead minimal - database integrity karşısında önemsiz
- Connection pooling preserved - transaction service optimize edilmiş
- Memory leaks prevented - resource cleanup automatic
- Logging comprehensive - debugging ve monitoring için

### **Monitoring & Alerts:**
- Transaction success/failure rates izlenmeli
- Partial completion attempts logged olmalı
- Database inconsistency reports scheduled olmalı
- Business process exceptions tracked olmalı

---

**⚡ REMEMBER: Veri bütünlüğü hiçbir performance gain'in üzerinde değildir!**

Bu document'i her yeni developer onboarding'inde paylaşın ve transaction safety'yi proje culture'ın ayrılmaz parçası yapın. 