/* eslint-disable prettier/prettier */
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { MusteriController } from '../src/musteri/musteri.controller';
import { MusteriService } from '../src/musteri/musteri.service';
import { DatabaseTransactionService } from '../src/database/database-transaction.service';
import { DatabaseConfigService } from '../src/database/database-config.service';

describe('MusteriController (e2e-ish)', () => {
  let app: INestApplication;

  const queryRunnerMock = {} as any;

  const musteriServiceMock = {
    checkOdaYatakMusaitlik: jest.fn(),
    checkTCExists: jest.fn(),
    createMusteriIslemWithTransaction: jest.fn(),
    kaydetKonaklamaWithTransaction: jest.fn(),
    kaydetIslemWithTransaction: jest.fn(),
    getMusteriBilgiByTCN: jest.fn(),
    checkMusteriDurum: jest.fn(),
  };

  const transactionServiceMock = {
    executeInTransaction: jest.fn(),
    executeQuery: jest.fn(),
  };

  const dbConfigMock = {
    getTableName: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    transactionServiceMock.executeInTransaction.mockImplementation(
      async (cb: (qr: any) => Promise<unknown>) => cb(queryRunnerMock),
    );
    musteriServiceMock.checkOdaYatakMusaitlik.mockResolvedValue({ musait: true, message: 'MÜSAİT' });
    musteriServiceMock.checkTCExists.mockResolvedValue(false);
    musteriServiceMock.createMusteriIslemWithTransaction.mockResolvedValue({
      success: true,
      message: 'OK',
      musteriNo: 777,
    });
    musteriServiceMock.kaydetKonaklamaWithTransaction.mockResolvedValue(undefined);
    musteriServiceMock.kaydetIslemWithTransaction.mockResolvedValue(undefined);

    const moduleRef = await Test.createTestingModule({
      controllers: [MusteriController],
      providers: [
        { provide: MusteriService, useValue: musteriServiceMock },
        { provide: DatabaseTransactionService, useValue: transactionServiceMock },
        { provide: DatabaseConfigService, useValue: dbConfigMock },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /musteri/musteri-islem 201 ve success=true döner', async () => {
    await request(app.getHttpServer())
      .post('/musteri/musteri-islem')
      .send({
        MstrTCN: '11111111111',
        MstrHspTip: 'Bireysel',
        OdaYatak: '101-1',
        planlananCikisTarihi: '01.01.2030',
        kullaniciAdi: 'tester',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toEqual({
          success: true,
          message: 'Yeni müşteri ve konaklama kaydı başarıyla eklendi!',
          data: { musteriNo: 777 },
        });
      });
  });
});

