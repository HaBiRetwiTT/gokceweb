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
  // Güvenlik için bunları .env'e almak önerilir; şu an kullanıcı isteği gereği sabit alıyoruz
  private readonly token = 'rc-JzxDFUSTAi2Vnj0TjWptAsFbGP13zDgXqteaS';
  private readonly hrId = '606881361';

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

  async fetchAndStoreReservations(win?: FetchWindow): Promise<{ inserted: number; updated: number }> {
    const inserted = { count: 0 };
    const updated = { count: 0 };

    return await this.tx.executeInTransaction(async (qr) => {
      const schema = this.dbConfig.getTableSchema();

      // 1) HR'den rezervasyonları çek
      const url = `${this.baseUrl}${this.hrId}/reservations`;
      const params: Record<string, string> = {};
      if (win?.from) params['from'] = win.from;
      if (win?.to) params['to'] = win.to;

      const resp = await firstValueFrom(
        this.http.get(url, {
          headers: { Authorization: `Bearer ${this.token}` },
          params,
        }),
      );

      const items: any[] = resp.data?.data || resp.data?.reservations || [];

      // 2) Kayıtları tblHRzvn içine upsert et
      // Not: tblHRzvn mevcut değilse önce oluşturulmalıdır.
      for (const it of items) {
        const hrResId = String(it.id || it.ReservationId || it.reservation_id || '');
        if (!hrResId) continue;

        const musteriTCKN = (it.guest?.identity_no || it.guest?.national_id || '').toString();
        const adSoyad = [it.guest?.first_name, it.guest?.last_name].filter(Boolean).join(' ').trim();
        const email = (it.guest?.email || '').toString();
        const tel = (it.guest?.phone || '').toString();
        const ulke = (it.guest?.country || it.guest?.country_code || '').toString();
        const odaTipiHR = (it.room_kind || it.room_type || '').toString();
        // hrCode: görseldeki Code sütununa karşılık gelebilecek alanlar
        const hrCode = (
          it.code || it.room_code || it.room?.code || it.rate_code || it.rate_plan_code || ''
        ).toString();
        // Eşleştirme tablosundan projectOdaTip'i çek
        let odaTipiProj = '';
        if (hrCode) {
          const mapSql = `SELECT TOP 1 projectOdaTip FROM ${schema}.tblHRRoomTypeMap WHERE hrCode = @0 AND aktif = 1`;
          const mapRes = await this.tx.executeQuery(qr, mapSql, [hrCode]);
          odaTipiProj = (mapRes?.[0]?.projectOdaTip || '').toString();
        }
        const grsTrh = this.toDdMmYyyy(it.checkin || it.arrival_date);
        const cksTrh = this.toDdMmYyyy(it.checkout || it.departure_date);
        const doviz = (it.currency || '').toString();
        const ucret = Number(it.total_price || it.price || it.amount || 0) || 0;
        const kanal = (it.channel || it.source || '').toString();
        const durum = (it.status || '').toString();
        const rawJson = JSON.stringify(it);

        // Upsert mantığı: önce var mı kontrol et, varsa UPDATE, yoksa INSERT
        const existsSql = `SELECT COUNT(1) as cnt FROM ${schema}.tblHRzvn WHERE hrResId = @0`;
        const ex = await this.tx.executeQuery(qr, existsSql, [hrResId]);
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
              kanal = @13,
              updatedAt = @14,
              rawJson = @15
            WHERE hrResId = @0`;
          await this.tx.executeQuery(qr, updateSql, [
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
            kanal,
            this.toDdMmYyyy(new Date()),
            rawJson,
          ]);
          updated.count += 1;
        } else {
          const insertSql = `
            INSERT INTO ${schema}.tblHRzvn (
              hrResId, durum, musteriTCKN, adSoyad, email, tel, ulkeKodu, odaTipiHR, odaTipiProj,
              grsTrh, cksTrh, odemeDoviz, ucret, kanal, updatedAt, rawJson
            ) VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10,@11,@12,@13,@14,@15)`;
          await this.tx.executeQuery(qr, insertSql, [
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
            kanal,
            this.toDdMmYyyy(new Date()),
            rawJson,
          ]);
          inserted.count += 1;
        }
      }

      return { inserted: inserted.count, updated: updated.count };
    });
  }
}


