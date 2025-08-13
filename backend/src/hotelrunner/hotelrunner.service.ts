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
    const total = Number(totalCandidates.find((v: any) => v !== undefined && v !== null) || 0) || 0;

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

  async fetchAndStoreReservations(win?: FetchWindow): Promise<{ inserted: number; updated: number; rawUpserted: number }> {
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
        const hrResId = String(it.id || it.ReservationId || it.reservation_id || '');
        if (!hrResId) continue;

        // 2) RAW tabloya yaz (idempotent upsert)
        const durumRaw = (it.status || it.state || '').toString();
        const updatedAtRaw = this.toDdMmYyyy(it.updated_at || new Date());
        const rawJson = JSON.stringify(it);

        const rawExistsSql = `SELECT COUNT(1) as cnt FROM ${schema}.tblHRzvnRaw WHERE hrResId = @0`;
        const rawEx = await this.tx.executeQuery(queryRunner, rawExistsSql, [hrResId]);
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
        const musteriTCKN = (it.guest?.identity_no || it.guest?.national_id || it.guest_national_id || '').toString();
        const adSoyad = [
          it.guest?.first_name || it.firstname,
          it.guest?.last_name || it.lastname,
        ]
          .filter(Boolean)
          .join(' ')
          .trim();
        const email = (it.guest?.email || it.address?.email || '').toString();
        const tel = (it.guest?.phone || it.address?.phone || '').toString();
        const ulke = (
          it.guest?.country || it.address?.country_code || it.country || it.address?.country || ''
        ).toString();

        const odaTipiHR = (
          it.room_kind || it.room_type || it.rooms?.[0]?.name || it.rooms?.[0]?.name_presentation || ''
        ).toString();

        const hrCode = (
          it.code || it.room_code || it.room?.code || it.rate_code || it.rate_plan_code || it.inv_code || it.rooms?.[0]?.rate_code || ''
        ).toString();

        let odaTipiProj = '';
        if (hrCode) {
          const mapSql = `SELECT TOP 1 projectOdaTip FROM ${schema}.tblHRRoomTypeMap WHERE hrCode = @0 AND aktif = 1`;
          const mapRes = await this.tx.executeQuery(queryRunner, mapSql, [hrCode]);
          odaTipiProj = (mapRes?.[0]?.projectOdaTip || '').toString();
        }

        const grsTrh = this.toDdMmYyyy(it.checkin_date || it.checkin || it.arrival_date || it.rooms?.[0]?.checkin_date);
        const cksTrh = this.toDdMmYyyy(it.checkout_date || it.checkout || it.departure_date || it.rooms?.[0]?.checkout_date);
        const doviz = (it.currency || it.rooms?.[0]?.currency || '').toString();
        const ucret = Number(
          it.total || it.item_total || it.sub_total || it.total_price || it.price || it.amount || it.rooms?.[0]?.total || 0,
        ) || 0;
        const kanal = (it.channel || it.source || it.channel_display || '').toString();
        const durum = (it.status || it.state || '').toString();
        const paidStatus = this.computePaidStatus(it);

        const existsSql = `SELECT COUNT(1) as cnt FROM ${schema}.tblHRzvn WHERE hrResId = @0`;
        const ex = await this.tx.executeQuery(queryRunner, existsSql, [hrResId]);
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

      return { inserted: structuredInserted.count, updated: structuredUpdated.count, rawUpserted: rawUpserted.count };
    });
  }
}


