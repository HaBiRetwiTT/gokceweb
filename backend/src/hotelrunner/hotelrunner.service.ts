/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { DatabaseTransactionService } from '../database/database-transaction.service';
import { DatabaseConfigService } from '../database/database-config.service';

type FetchWindow = { from?: string; to?: string };

@Injectable()
export class HotelRunnerService {
  private readonly baseUrl = 'https://app.hotelrunner.com/api/v2/apps/';
  // Kimlik bilgileri .env üzerinden alınır (readonly, deklarasyonda set edilir)
  private readonly token: string =
    process.env.HOTELRUNNER_TOKEN ||
    process.env.HR_TOKEN ||
    process.env.token ||
    '';
  private readonly hrId: string =
    process.env.HOTELRUNNER_ID || process.env.HR_ID || process.env.hr_id || '';

  constructor(
    private readonly http: HttpService,
    private readonly tx: DatabaseTransactionService,
    private readonly dbConfig: DatabaseConfigService,
  ) {}

  private toDdMmYyyy(dateIso: string | Date | undefined | null): string {
    if (!dateIso) return '';
    const d = typeof dateIso === 'string' ? new Date(dateIso) : dateIso;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }

  private truncateValue(value: unknown, maxLen: number): string {
    const s = (value ?? '').toString();
    return s.length > maxLen ? s.slice(0, maxLen) : s;
  }

  private normalizeCountry(input: unknown, maxLen = 3): string {
    const raw = (input ?? '').toString().trim();
    if (!raw) return '';
    // Örnek: "Turkey (TR)" → TR
    const parenCode = /\(([A-Za-z]{2,3})\)/.exec(raw)?.[1];
    if (parenCode) return this.truncateValue(parenCode.toUpperCase(), maxLen);
    // "TR" veya "TUR" gibi zaten kod ise
    if (/^[A-Za-z]{2,3}$/.test(raw))
      return this.truncateValue(raw.toUpperCase(), maxLen);
    // Harf/digit karışık veya ülke adı: sadece ilk 3 büyük harf
    const lettersOnly = raw.replace(/[^A-Za-z]/g, '').toUpperCase();
    if (lettersOnly.length >= 2) return this.truncateValue(lettersOnly, maxLen);
    return this.truncateValue(raw.toUpperCase(), maxLen);
  }

  private extractNationalId(it: any): string {
    const candidateValues: Array<unknown> = [
      it.guest?.identity_no,
      it.guest?.identityNo,
      it.guest?.national_id,
      it.guest?.nationalId,
      it.guest_national_id,
      it.guestNationalId,
      it.billing_address?.tax_id,
      it.billing_address?.taxId,
      it.tax_id,
      it.address?.tax_id,
      it.address?.taxId,
    ];
    for (const cand of candidateValues) {
      if (cand === undefined || cand === null) continue;
      const raw = String(cand).trim();
      if (!raw) continue;
      const digits = raw.replace(/\D/g, '');
      if (digits.length === 11) return this.truncateValue(digits, 20); // TCKN
      if (digits.length === 10) return this.truncateValue(digits, 20); // VKN
    }
    // Rooms -> guests içindeki kimlik/pasaport alanlarına bak
    if (Array.isArray(it.rooms)) {
      for (const r of it.rooms) {
        if (!Array.isArray(r.guests)) continue;
        for (const g of r.guests) {
          const guestCand = [
            g?.identity_no,
            g?.identityNo,
            g?.national_id,
            g?.nationalId,
            g?.passport_no,
            g?.passportNo,
            g?.document_no,
            g?.documentNo,
            g?.id_number,
            g?.idNumber,
          ];
          for (const c of guestCand) {
            if (c === undefined || c === null) continue;
            const raw = String(c).trim();
            if (!raw) continue;
            const digits = raw.replace(/\D/g, '');
            if (digits.length === 11) return this.truncateValue(digits, 20);
            if (digits.length === 10) return this.truncateValue(digits, 20);
            // Pasaport gibi alfanümerik değerler
            if (/^[A-Za-z0-9]{5,}$/.test(raw))
              return this.truncateValue(raw, 20);
          }
        }
      }
    }
    // Son çare: guest_national_id ham değer (maskesiz değilse)
    const fallback = (it.guest_national_id ?? '').toString().trim();
    if (fallback) return this.truncateValue(fallback, 20);
    // En son fallback: telefonu rakamlara çevirip 6+ hane ise kullan
    const tel = (it.guest?.phone || it.address?.phone || '').toString();
    const telDigits = tel.replace(/\D/g, '');
    if (telDigits.length >= 6) return this.truncateValue(telDigits, 20);
    return '';
  }

  private computePaidStatus(it: any): string {
    const totalCandidates = [
      it.total,
      it.item_total,
      it.sub_total,
      it.total_price,
      it.price,
      it.amount,
      it.rooms?.[0]?.total,
    ];
    const total =
      Number(
        totalCandidates.find((v: any) => v !== undefined && v !== null) || 0,
      ) || 0;

    let paid = 0;
    if (it.paid_amount !== undefined && it.paid_amount !== null) {
      paid = Number(it.paid_amount) || 0;
    } else if (Array.isArray(it.payments)) {
      paid = it.payments
        .filter((p: any) => (p.state || p.status) === 'completed')
        .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    }

    if (total > 0 && paid >= total) return 'PAID';
    if (paid > 0) return 'PARTIAL';
    return 'UNPAID';
  }

  async fetchAndStoreReservations(
    win?: FetchWindow,
  ): Promise<{ inserted: number; updated: number; rawUpserted: number }> {
    const structuredInserted = { count: 0 };
    const structuredUpdated = { count: 0 };
    const rawUpserted = { count: 0 };

    return await this.tx.executeInTransaction(async (queryRunner) => {
      const schema = this.dbConfig.getTableSchema();

      // 1) HR'den rezervasyonları çek
      const url = `${this.baseUrl}reservations`;
      const params: Record<string, string> = {
        token: this.token,
        hr_id: this.hrId,
      };
      if (win?.from) params['from'] = win.from;
      if (win?.to) params['to'] = win.to;

      const resp = await firstValueFrom(this.http.get(url, { params }));
      const items: any[] = resp.data?.data || resp.data?.reservations || [];

      for (const it of items) {
        const hrResId = String(
          it.id || it.ReservationId || it.reservation_id || '',
        );
        if (!hrResId) continue;

        // 2) RAW tabloya yaz (idempotent upsert)
        const durumRaw = (it.status || it.state || '').toString();
        const updatedAtRaw = this.toDdMmYyyy(it.updated_at || new Date());
        const rawJson = JSON.stringify(it);

        const rawExistsSql = `SELECT COUNT(1) as cnt FROM ${schema}.tblHRzvnRaw WHERE hrResId = @0`;
        const rawEx = await this.tx.executeQuery(queryRunner, rawExistsSql, [
          hrResId,
        ]);
        const rawCnt = Number(rawEx?.[0]?.cnt || 0);
        if (rawCnt > 0) {
          const rawUpdateSql = `
            UPDATE ${schema}.tblHRzvnRaw SET
              durum = @1,
              updatedAt = @2,
              rawJson = @3
            WHERE hrResId = @0`;
          await this.tx.executeQuery(queryRunner, rawUpdateSql, [
            hrResId,
            durumRaw,
            updatedAtRaw,
            rawJson,
          ]);
        } else {
          const rawInsertSql = `
            INSERT INTO ${schema}.tblHRzvnRaw (hrResId, durum, updatedAt, rawJson)
            VALUES (@0,@1,@2,@3)`;
          await this.tx.executeQuery(queryRunner, rawInsertSql, [
            hrResId,
            durumRaw,
            updatedAtRaw,
            rawJson,
          ]);
        }
        rawUpserted.count += 1;

        // 3) RAW -> STRUCTURED dönüşümü ve upsert tblHRzvn
        const musteriTCKN = this.extractNationalId(it);
        const adSoyad = this.truncateValue(
          [
            it.guest?.first_name || it.firstname,
            it.guest?.last_name || it.lastname,
          ]
            .filter(Boolean)
            .join(' ')
            .trim(),
          150,
        );
        const email = this.truncateValue(
          it.guest?.email || it.address?.email || '',
          150,
        );
        const tel = this.truncateValue(
          it.guest?.phone || it.address?.phone || '',
          50,
        );
        const ulke = this.normalizeCountry(
          it.guest?.country ||
            it.address?.country_code ||
            it.country ||
            it.address?.country ||
            '',
          3,
        );

        const odaTipiHR = this.truncateValue(
          it.room_kind ||
            it.room_type ||
            it.rooms?.[0]?.name ||
            it.rooms?.[0]?.name_presentation ||
            '',
          100,
        );

        const hrCode = this.truncateValue(
          it.code ||
            it.room_code ||
            it.room?.code ||
            it.rate_code ||
            it.rate_plan_code ||
            it.inv_code ||
            it.rooms?.[0]?.rate_code ||
            '',
          100,
        );

        let odaTipiProj = '';
        if (hrCode) {
          const mapSql = `SELECT TOP 1 projectOdaTip FROM ${schema}.tblHRRoomTypeMap WHERE hrCode = @0 AND aktif = 1`;
          const mapRes = await this.tx.executeQuery(queryRunner, mapSql, [
            hrCode,
          ]);
          odaTipiProj = this.truncateValue(
            (mapRes?.[0]?.projectOdaTip || '').toString(),
            100,
          );
        }

        const grsTrh = this.toDdMmYyyy(
          it.checkin_date ||
            it.checkin ||
            it.arrival_date ||
            it.rooms?.[0]?.checkin_date,
        );
        const cksTrh = this.toDdMmYyyy(
          it.checkout_date ||
            it.checkout ||
            it.departure_date ||
            it.rooms?.[0]?.checkout_date,
        );
        const doviz = this.truncateValue(
          (it.currency || it.rooms?.[0]?.currency || '')
            .toString()
            .toUpperCase(),
          3,
        );
        const ucret =
          Number(
            it.total ||
              it.item_total ||
              it.sub_total ||
              it.total_price ||
              it.price ||
              it.amount ||
              it.rooms?.[0]?.total ||
              0,
          ) || 0;
        const kanal = this.truncateValue(
          (it.channel || it.source || it.channel_display || '').toString(),
          100,
        );
        const durum = this.truncateValue(
          (it.status || it.state || '').toString(),
          50,
        );
        const paidStatus = this.computePaidStatus(it);

        // Lokal olarak 'checked_in' veya 'no_show' yapılan kayıtları HR senkronu ile EZME
        const existsSql = `
          SELECT COUNT(1) as cnt
          FROM ${schema}.tblHRzvn WITH (NOLOCK)
          WHERE hrResId = @0
            AND ISNULL(durum,'') NOT IN ('checked_in','no_show')`;
        const ex = await this.tx.executeQuery(queryRunner, existsSql, [
          hrResId,
        ]);
        const cnt = Number(ex?.[0]?.cnt || 0);

        if (cnt > 0) {
          const updateSql = `
            UPDATE ${schema}.tblHRzvn SET
              durum = @1,
              musteriTCKN = @2,
              adSoyad = @3,
              email = @4,
              tel = @5,
              ulkeKodu = @6,
              odaTipiHR = @7,
              odaTipiProj = @8,
              grsTrh = @9,
              cksTrh = @10,
              odemeDoviz = @11,
              ucret = @12,
              paidStatus = @13,
              kanal = @14,
              updatedAt = @15,
              hrCode = @16
            WHERE hrResId = @0`;
          await this.tx.executeQuery(queryRunner, updateSql, [
            hrResId,
            durum,
            musteriTCKN,
            adSoyad,
            email,
            tel,
            ulke,
            odaTipiHR,
            odaTipiProj,
            grsTrh,
            cksTrh,
            doviz,
            ucret,
            paidStatus,
            kanal,
            this.toDdMmYyyy(new Date()),
            hrCode,
          ]);
          structuredUpdated.count += 1;
        } else {
          const insertSql = `
            INSERT INTO ${schema}.tblHRzvn (
              hrResId, durum, musteriTCKN, adSoyad, email, tel, ulkeKodu, odaTipiHR, odaTipiProj,
              grsTrh, cksTrh, odemeDoviz, ucret, paidStatus, kanal, updatedAt, hrCode
            ) VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10,@11,@12,@13,@14,@15,@16)`;
          await this.tx.executeQuery(queryRunner, insertSql, [
            hrResId,
            durum,
            musteriTCKN,
            adSoyad,
            email,
            tel,
            ulke,
            odaTipiHR,
            odaTipiProj,
            grsTrh,
            cksTrh,
            doviz,
            ucret,
            paidStatus,
            kanal,
            this.toDdMmYyyy(new Date()),
            hrCode,
          ]);
          structuredInserted.count += 1;
        }
      }

      return {
        inserted: structuredInserted.count,
        updated: structuredUpdated.count,
        rawUpserted: rawUpserted.count,
      };
    });
  }

  // Bekleyen rezervasyonlar: grsTrh <= bugün ve durum = 'confirmed'
  async getPendingReservations(): Promise<any[]> {
    const schema = this.dbConfig.getTableSchema();
    return await this.tx.executeInTransaction(async (qr) => {
      const sql = `
        SELECT 
          z.hrResId,
          COALESCE(
            JSON_VALUE(rw.rawJson,'$.hr_number'),
            JSON_VALUE(rw.rawJson,'$.voucher_number'),
            JSON_VALUE(rw.rawJson,'$.rooms[0].voucher_number')
          ) AS hrNumber,
          z.adSoyad,
          z.ulkeKodu,
          z.grsTrh,
          CONVERT(varchar(10), TRY_CONVERT(date, z.grsTrh, 104), 23) AS grsKey,
          z.cksTrh,
          CONVERT(varchar(10), TRY_CONVERT(date, z.cksTrh, 104), 23) AS cksKey,
          z.odaTipiProj,
          z.kanal,
          z.paidStatus,
          z.ucret,
          z.odemeDoviz,
          z.durum
        FROM ${schema}.tblHRzvn z
        OUTER APPLY (
          SELECT TOP 1 rawJson
          FROM ${schema}.tblHRzvnRaw r
          WHERE r.hrResId = z.hrResId
          ORDER BY r.updatedAt DESC
        ) rw
        WHERE z.durum = 'confirmed'
        ORDER BY TRY_CONVERT(date, z.grsTrh, 104) ASC, z.adSoyad ASC`;
      const rows = await this.tx.executeQuery(qr, sql, []);
      return rows || [];
    });
  }

  // tblHRzvnRaw.rawJson içinden hr_number'ı çözer
  private async resolveHrNumber(hrResId: string): Promise<string> {
    const schema = this.dbConfig.getTableSchema();
    try {
      return await this.tx.executeInTransaction(async (qr) => {
        const sql = `SELECT TOP 1 rawJson FROM ${schema}.tblHRzvnRaw WHERE hrResId = @0 ORDER BY updatedAt DESC`;
        const rows = await this.tx.executeQuery(qr, sql, [hrResId]);
        const raw = rows?.[0]?.rawJson as string | undefined;
        if (!raw) return hrResId;
        try {
          const obj = JSON.parse(raw);
          const hrNumber = obj?.hr_number; // Sadece hr_number kullan
          return (hrNumber || '').toString();
        } catch {
          return hrResId;
        }
      });
    } catch {
      return hrResId;
    }
  }

  // HotelRunner portalına No-Show bildiren basit proxy (belgelenmiş resmi endpoint olmayabilir; örnek varsayım)
  async markReservationNoShow(hrResId: string): Promise<{
    success: boolean;
    message: string;
    data?: any;
    status?: number;
  }> {
    try {
      if (!this.token || !this.hrId) {
        return {
          success: false,
          message: 'HR kimlik bilgileri eksik (TOKEN/HR_ID).',
          data: null,
          status: 500,
        };
      }
      const hrNumber = await this.resolveHrNumber(hrResId);
      if (!hrNumber) {
        return {
          success: false,
          message: 'hr_number bulunamadı (Raw JSON içinde yok).',
          data: null,
          status: 400,
        };
      }
      const url = `${this.baseUrl}reservations/fire`;
      const params: Record<string, string> = {
        token: this.token,
        hr_id: this.hrId,
        hr_number: hrNumber,
        event: 'cancel',
        cancel_reason: 'no_show',
      };
      const resp = await firstValueFrom(this.http.put(url, {}, { params }));
      const ok = resp?.data?.status === 'success' || resp?.status < 400;
      const msg = ok
        ? 'HR portalına No-Show bildirildi.'
        : resp?.data?.error || 'HR yanıtı başarısız';
      return {
        success: ok,
        message: msg,
        data: resp.data,
        status: resp.status,
      };
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'No-Show bildirimi başarısız';
      return {
        success: false,
        message: msg,
        data: error?.response?.data,
        status: error?.response?.status,
      };
    }
  }

  // HotelRunner portalında Check-in (confirm) olayı
  async markReservationCheckIn(hrResId: string): Promise<{
    success: boolean;
    message: string;
    data?: any;
    status?: number;
  }> {
    try {
      if (!this.token || !this.hrId) {
        return {
          success: false,
          message: 'HR kimlik bilgileri eksik (TOKEN/HR_ID).',
          data: null,
          status: 500,
        };
      }
      const hrNumber = await this.resolveHrNumber(hrResId);
      if (!hrNumber) {
        return {
          success: false,
          message: 'hr_number bulunamadı (Raw JSON içinde yok).',
          data: null,
          status: 400,
        };
      }
      const url = `${this.baseUrl}reservations/fire`;
      const params: Record<string, string> = {
        token: this.token,
        hr_id: this.hrId,
        hr_number: hrNumber,
        event: 'confirm',
      };
      const resp = await firstValueFrom(this.http.put(url, {}, { params }));
      const ok = resp?.data?.status === 'success' || resp?.status < 400;
      const msg = ok
        ? 'HR portalında Check-in (confirm) bildirildi.'
        : resp?.data?.error || 'HR yanıtı başarısız';
      return {
        success: ok,
        message: msg,
        data: resp.data,
        status: resp.status,
      };
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Check-in bildirimi başarısız';
      return {
        success: false,
        message: msg,
        data: error?.response?.data,
        status: error?.response?.status,
      };
    }
  }

  // Lokal durum güncellemesi
  async updateLocalReservationStatus(
    hrResId: string,
    status: 'checked_in' | 'no_show',
  ): Promise<{ success: boolean; message: string }> {
    const schema = this.dbConfig.getTableSchema();
    return await this.tx.executeInTransaction(async (qr) => {
      const sql = `UPDATE ${schema}.tblHRzvn SET durum = @1, updatedAt = @2 WHERE hrResId = @0`;
      await this.tx.executeQuery(qr, sql, [
        hrResId,
        status,
        this.toDdMmYyyy(new Date()),
      ]);
      return { success: true, message: `Lokal durum güncellendi: ${status}` };
    });
  }
}
