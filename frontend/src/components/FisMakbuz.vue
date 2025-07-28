<template>
  <div class="fis-makbuz" ref="printArea" style="width: 78mm; height: 165mm; padding: 2mm; font-family: Arial, sans-serif; font-size: 2.5mm; line-height: 1.3; background: white; color: black; box-sizing: border-box;">
    <!-- Üst bilgi satırı -->
    <div style="display: flex; justify-content: space-between; font-size: 2.2mm; margin-bottom: 3mm; border-bottom: 1px solid #000; padding-bottom: 1mm;">
      <span>TARİH: {{ tarih }}</span>
      <span>İŞLEMİ YAPAN: {{ islemYapan }}</span>
      <span>FİŞ NO: {{ fisNo }}</span>
    </div>
    
    <!-- Logo ve başlık -->
    <div class="header" style="display: flex; align-items: center; margin-bottom: 4mm;">
      <div class="logo" style="width: 20mm; height: 20mm; background: #000; display: flex; align-items: center; justify-content: center; margin-right: 4mm; border-radius: 2mm;">
        <span style="font-size: 12mm; color: white; font-weight: bold;">G</span>
      </div>
      <div class="title" style="flex: 1; display: flex; flex-direction: column; align-items: flex-start;">
        <div class="kurum-adi" style="font-size: 4.5mm; font-weight: bold; letter-spacing: 0.5mm; margin-bottom: 1mm;">GÖKÇE PANSİYON<sup style="font-size: 3mm;">®</sup></div>
        <div class="kurum-alt" style="font-size: 3mm; color: #333; font-style: italic;">İstanbul'daki Eviniz</div>
      </div>
    </div>
    
    <!-- Makbuz başlığı -->
    <div class="makbuz-baslik" style="text-align: center; font-size: 5mm; font-weight: bold; margin: 3mm 0 4mm 0; letter-spacing: 1mm; border: 2px solid #000; padding: 2mm; background: #f0f0f0;">TAHSİLAT MAKBUZU</div>
    
    <!-- Müşteri bilgileri -->
    <div class="row sayin-row" style="margin-bottom: 3mm;">
      <span class="label" style="font-weight: bold; font-size: 3mm; display: inline-block; width: 15mm;">SAYIN</span>
      <div class="value-box" style="border: 2px solid #000; padding: 2mm; flex: 1; text-align: center; font-weight: bold; font-size: 4mm; min-height: 8mm; display: flex; align-items: center; justify-content: center;">{{ musteriAdi }}</div>
    </div>
    
    <div class="row oda-row" style="margin-bottom: 3mm;">
      <span class="label" style="font-weight: bold; font-size: 3mm; display: inline-block; width: 15mm;">ODA</span>
      <div class="value-box" style="border: 2px solid #000; padding: 2mm; flex: 1; text-align: center; font-weight: bold; font-size: 4mm; min-height: 8mm; display: flex; align-items: center; justify-content: center;">{{ odaBilgisi }}</div>
    </div>
    
    <!-- Ana hizmet kutusu -->
    <div class="row aciklama-row" style="margin-bottom: 4mm;">
      <div class="main-service-box" style="border: 3px solid #000; padding: 4mm; text-align: center; font-weight: bold; font-size: 5mm; min-height: 15mm; display: flex; align-items: center; justify-content: center; background: #f8f8f8;">{{ aciklama }}</div>
    </div>
    
    <!-- Tutar bilgileri -->
    <div class="row tutar-row" style="margin-bottom: 3mm;">
      <span class="label" style="font-weight: bold; font-size: 3mm; display: inline-block; width: 15mm;">TUTAR</span>
      <div class="value-box" style="border: 2px solid #000; padding: 2mm; width: 25mm; text-align: center; font-weight: bold; font-size: 4mm; display: flex; align-items: center; justify-content: center;">₺{{ tutar }}</div>
    </div>
    
    <div class="payment-method" style="text-align: center; font-size: 3mm; margin-bottom: 3mm; font-weight: bold;">NAKİT OLARAK TAHSİL EDİLMİŞTİR.</div>
    
    <!-- Borç bilgileri -->
    <div class="row borc-row" style="display: flex; gap: 4mm; margin-bottom: 3mm;">
      <div style="flex: 1;">
        <span class="label" style="font-weight: bold; font-size: 3mm; display: block; margin-bottom: 1mm;">Kalan Borç</span>
        <div class="value-box" style="border: 2px solid #000; padding: 2mm; text-align: center; font-weight: bold; font-size: 3.5mm; min-height: 6mm; display: flex; align-items: center; justify-content: center;">{{ kalanBorc }}</div>
      </div>
      <div style="flex: 1;">
        <span class="label" style="font-weight: bold; font-size: 3mm; display: block; margin-bottom: 1mm;">Son Ödeme Tarihi</span>
        <div class="value-box" style="border: 2px solid #000; padding: 2mm; text-align: center; font-weight: bold; font-size: 3.5mm; min-height: 6mm; display: flex; align-items: center; justify-content: center;">{{ sonOdemeTarihi }}</div>
      </div>
    </div>
    
    <!-- Bilgilendirme bölümü -->
    <div class="bilgilendirme" style="margin: 4mm 0; font-size: 2.8mm; border: 2px solid #000; padding: 3mm; background: #f0f0f0;">
      <div style="font-weight: bold; text-align: center; margin-bottom: 2mm; font-size: 3mm;">BİLGİLENDİRME</div>
      <div style="margin-bottom: 1mm;">WIFI ŞİFRESİ: GOKCE2010gokce</div>
      <div style="margin-bottom: 1mm;">GÜNLÜK KALIMLARDA ODA ÇIKIŞ SAATİ ÖĞLEN 12:00</div>
      <div style="margin-bottom: 1mm;">LÜTFEN FİŞİ VE PARANIZI KONTROL EDEREK ALINIZ</div>
      <div style="margin-bottom: 2mm;">BU BELGENİN MALİ BİR DEĞERİ YOKTUR</div>
      
      <div class="istek" style="text-align: center; font-weight: bold; font-size: 3mm; margin: 3mm 0;">DAHA İYİ HİZMET VEREBİLMEMİZ İÇİN<br/>İSTEK, ÖNERİ VE ŞİKAYETLERİNİZİ<br/>LÜTFEN BİZE İLETİNİZ...</div>
      
      <div class="iletisim" style="display: flex; justify-content: space-between; font-size: 2.5mm; margin-top: 2mm;">
        <div>
          <div>TEL: 0 (212) 296 66 60</div>
          <div>GSM: 0 (545) 296 66 60</div>
        </div>
        <div>
          <div>MAIL: bilgi@gokcepansiyon.com</div>
          <div>WEB: www.gokcepansiyon.com</div>
        </div>
      </div>
    </div>
    
    <!-- Barkod alanı -->
    <div class="barkod" style="margin: 3mm 0; text-align: center;">
      <div style="background: #000; color: white; padding: 2mm; font-family: monospace; font-size: 3mm; letter-spacing: 1mm;">{{ fisNo }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps } from 'vue';

defineProps<{
  musteriAdi: string;
  odaBilgisi: string;
  aciklama: string;
  tutar: string | number;
  kalanBorc: string | number;
  sonOdemeTarihi: string;
  tarih: string;
  islemYapan: string;
  fisNo: string;
}>();

const printArea = ref<HTMLDivElement | null>(null);
</script>

<style scoped>
.fis-makbuz {
  width: 78mm;
  height: 165mm;
  background: #fff;
  color: #000;
  font-family: Arial, sans-serif;
  font-size: 13px;
  border: 1px solid #222;
  padding: 8mm 6mm 6mm 6mm;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}
.header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 4mm;
}
.logo {
  width: 18mm;
  height: 18mm;
  background: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 6mm;
  border-radius: 3mm;
  font-size: 10mm;
}
.logo-placeholder {
  font-size: 10mm;
  color: #888;
}
.title {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.kurum-adi {
  font-size: 1.2em;
  font-weight: bold;
  letter-spacing: 1px;
}
.kurum-alt {
  font-size: 0.9em;
  color: #444;
}
.makbuz-baslik {
  text-align: center;
  font-size: 1.1em;
  font-weight: bold;
  margin: 2mm 0 3mm 0;
  letter-spacing: 1px;
}
.row {
  display: flex;
  align-items: center;
  margin-bottom: 2mm;
}
.label {
  font-weight: bold;
  min-width: 22mm;
  display: inline-block;
}
.value {
  flex: 1;
  font-weight: bold;
  font-size: 1.1em;
}
.tutar-row .tutar {
  font-size: 1.3em;
  color: #222;
  margin-left: 2mm;
}
.tutar-row .nakit {
  margin-left: 6mm;
  font-size: 0.95em;
  color: #444;
}
.borc-row {
  font-size: 0.95em;
  gap: 6mm;
}
.bilgilendirme {
  margin: 4mm 0 2mm 0;
  font-size: 0.93em;
  color: #222;
  border-top: 1px dashed #aaa;
  border-bottom: 1px dashed #aaa;
  padding: 2mm 0;
}
.bilgilendirme .istek {
  margin: 2mm 0 1mm 0;
  font-weight: bold;
  text-align: center;
}
.bilgilendirme .iletisim {
  display: flex;
  flex-wrap: wrap;
  gap: 4mm;
  font-size: 0.92em;
  margin-top: 2mm;
}
.barkod {
  margin: 4mm 0 2mm 0;
  text-align: center;
}
.barkod-placeholder {
  font-size: 1.2em;
  color: #888;
}
.footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.95em;
  margin-top: 2mm;
  border-top: 1px solid #ccc;
  padding-top: 2mm;
}
</style> 