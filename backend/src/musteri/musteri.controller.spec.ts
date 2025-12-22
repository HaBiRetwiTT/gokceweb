import { Test } from '@nestjs/testing';
import { MusteriController } from './musteri.controller';
import { MusteriService } from './musteri.service';
import { DatabaseTransactionService } from '../database/database-transaction.service';
import { DatabaseConfigService } from '../database/database-config.service';

describe('MusteriController', () => {
  let controller: MusteriController;

  const queryRunnerMock = {} as any;

  const musteriServiceMock = {
    checkOdaYatakMusaitlik: jest.fn(),
    checkTCExists: jest.fn(),
    getMusteriBilgiByTCN: jest.fn(),
    checkMusteriDurum: jest.fn(),
    createMusteriIslemWithTransaction: jest.fn(),
    kaydetKonaklamaWithTransaction: jest.fn(),
    kaydetIslemWithTransaction: jest.fn(),
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

    const moduleRef = await Test.createTestingModule({
      controllers: [MusteriController],
      providers: [
        { provide: MusteriService, useValue: musteriServiceMock },
        {
          provide: DatabaseTransactionService,
          useValue: transactionServiceMock,
        },
        { provide: DatabaseConfigService, useValue: dbConfigMock },
      ],
    }).compile();

    controller = moduleRef.get(MusteriController);
  });

  it('kayıt başarılıysa konaklama+işlem kayıtlarını transaction içinde yapar', async () => {
    transactionServiceMock.executeInTransaction.mockImplementation(
      async (cb: (qr: any) => Promise<unknown>) => cb(queryRunnerMock),
    );
    musteriServiceMock.checkOdaYatakMusaitlik.mockResolvedValue({
      musait: true,
      message: 'MÜSAİT',
    });
    musteriServiceMock.checkTCExists.mockResolvedValue(false);
    musteriServiceMock.createMusteriIslemWithTransaction.mockResolvedValue({
      success: true,
      message: 'OK',
      musteriNo: 123,
    });
    musteriServiceMock.kaydetKonaklamaWithTransaction.mockResolvedValue(
      undefined,
    );
    musteriServiceMock.kaydetIslemWithTransaction.mockResolvedValue(undefined);

    const result = await controller.createMusteriIslem(
      {
        MstrTCN: '11111111111',
        MstrHspTip: 'Bireysel',
        OdaYatak: '101-1',
        planlananCikisTarihi: '01.01.2030',
      },
      { user: { username: 'tester' } } as any,
    );

    expect(transactionServiceMock.executeInTransaction).toHaveBeenCalledTimes(
      1,
    );
    expect(
      musteriServiceMock.createMusteriIslemWithTransaction,
    ).toHaveBeenCalledTimes(1);
    expect(
      musteriServiceMock.kaydetKonaklamaWithTransaction,
    ).toHaveBeenCalledWith(
      queryRunnerMock,
      expect.objectContaining({ MstrKllnc: 'tester' }),
      123,
    );
    expect(musteriServiceMock.kaydetIslemWithTransaction).toHaveBeenCalledWith(
      queryRunnerMock,
      expect.objectContaining({ musteriDurumu: 'YENI' }),
      123,
    );

    expect(result).toEqual({
      success: true,
      message: 'Yeni müşteri ve konaklama kaydı başarıyla eklendi!',
      data: { musteriNo: 123 },
    });
  });

  it('transaction başarısızsa success=false döner ve kayıtları çağırmaz', async () => {
    transactionServiceMock.executeInTransaction.mockImplementation(
      async (cb: (qr: any) => Promise<unknown>) => cb(queryRunnerMock),
    );
    musteriServiceMock.checkOdaYatakMusaitlik.mockResolvedValue({
      musait: false,
      message: 'DOLU',
    });

    const result = await controller.createMusteriIslem(
      { MstrTCN: '11111111111', OdaYatak: '101-1', kullaniciAdi: 'tester' },
      {} as any,
    );

    expect(
      musteriServiceMock.kaydetKonaklamaWithTransaction,
    ).not.toHaveBeenCalled();
    expect(
      musteriServiceMock.kaydetIslemWithTransaction,
    ).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.message).toContain('DOLU');
  });
});
