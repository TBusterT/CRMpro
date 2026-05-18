import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Finance } from './entities/finance.entity';
import { CreateFinanceDto } from './dto/create-finance.dto';
import { UpdateFinanceDto } from './dto/update-finance.dto';

@Injectable()
export class FinanceService {
  constructor(
      @InjectRepository(Finance)
      private readonly financeRepository: Repository<Finance>,
  ) {}

  async create(dto: CreateFinanceDto): Promise<Finance> {
    const record = this.financeRepository.create({
      ...dto,
      description: dto.description.trim(),
      category: dto.category?.trim() || 'Без категорії',
    });
    return this.financeRepository.save(record);
  }

  async findAll(type?: string): Promise<Finance[]> {
    const query = this.financeRepository.createQueryBuilder('finance');

    if (type && (type === 'income' || type === 'expense')) {
      query.where('finance.type = :type', { type });
    }

    return query.orderBy('finance.createdAt', 'DESC').getMany();
  }

  async findOne(id: number): Promise<Finance> {
    const record = await this.financeRepository.findOne({ where: { id } });
    if (!record) throw new NotFoundException(`Запис #${id} не знайдений`);
    return record;
  }

  async update(id: number, dto: UpdateFinanceDto): Promise<Finance> {
    const record = await this.findOne(id);
    Object.assign(record, dto);
    return this.financeRepository.save(record);
  }

  async remove(id: number): Promise<{ message: string }> {
    const record = await this.findOne(id);
    await this.financeRepository.remove(record);
    return { message: `Запис #${id} видалений` };
  }

  async getSummary(): Promise<{ totalIncome: number; totalExpense: number; balance: number }> {
    const result = await this.financeRepository
        .createQueryBuilder('finance')
        .select('finance.type', 'type')
        .addSelect('SUM(finance.amount)', 'total')
        .groupBy('finance.type')
        .getRawMany();

    const totalIncome = +result.find(r => r.type === 'income')?.total || 0;
    const totalExpense = +result.find(r => r.type === 'expense')?.total || 0;

    return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
  }
}