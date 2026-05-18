import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(
      @InjectRepository(Client)
      private readonly clientsRepository: Repository<Client>,
  ) {}

  async create(dto: CreateClientDto): Promise<Client> {
    const existing = await this.clientsRepository.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Клієнт з таким email вже існує');

    const client = this.clientsRepository.create(dto);
    return this.clientsRepository.save(client);
  }

  async findAll(search?: string, status?: string): Promise<Client[]> {
    if (!search && !status) {
      return this.clientsRepository.find({ order: { createdAt: 'DESC' } });
    }

    const query = this.clientsRepository.createQueryBuilder('client');

    if (search) {
      query.where(
          'client.name ILIKE :search OR client.company ILIKE :search OR client.email ILIKE :search',
          { search: `%${search}%` },
      );
    }

    if (status && status !== 'all') {
      const method = search ? 'andWhere' : 'where';
      query[method]('client.status = :status', { status });
    }

    return query.orderBy('client.createdAt', 'DESC').getMany();
  }

  async findOne(id: number): Promise<Client> {
    const client = await this.clientsRepository.findOne({ where: { id } });
    if (!client) throw new NotFoundException(`Клієнт #${id} не знайдений`);
    return client;
  }

  async update(id: number, dto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(id);
    Object.assign(client, dto);
    return this.clientsRepository.save(client);
  }

  async remove(id: number): Promise<{ message: string }> {
    const client = await this.findOne(id);
    await this.clientsRepository.remove(client);
    return { message: `Клієнт #${id} видалений` };
  }
}