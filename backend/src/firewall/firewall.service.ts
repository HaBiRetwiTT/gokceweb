import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Firewall } from './firewall';
import * as fs from 'fs/promises';
import { Client } from 'basic-ftp';

@Injectable()
export class FirewallService {
  constructor(
    @InjectRepository(Firewall)
    private firewallRepository: Repository<Firewall>,
  ) {}

  async getKaliyorTcnList(): Promise<string[]> {
    const result = await this.firewallRepository.find({
      select: ['mstrTCN'],
      where: { MstrDurum: 'KALIYOR' },
    });
    return result.map((item) => item.mstrTCN);
  }

  async writeJsonFile(data: string[], filename: string) {
    await fs.writeFile(filename, JSON.stringify({ data }, null, 2), 'utf8');
  }

  async uploadToFtp(localFile: string, remoteFile: string) {
    const client = new Client();
    try {
      await client.access({
        host: '94.199.202.175',
        user: 'visitor',
        password: '6rm$p736U',
        secure: false,
      });
      await client.uploadFrom(localFile, remoteFile);
    } finally {
      client.close();
    }
  }

  async exportAndUploadKaliyorTcn() {
    const data = await this.getKaliyorTcnList();
    const filename = 'firewall.json';
    await this.writeJsonFile(data, filename);
    await this.uploadToFtp(filename, filename);
  }
}
