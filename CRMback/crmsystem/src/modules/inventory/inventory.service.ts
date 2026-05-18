import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductStatus } from './entities/inventory.entity';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
      @InjectRepository(Product)
      private readonly inventoryRepository: Repository<Product>,
  ) {}

  // Автоматично визначає статус по кількості
  private resolveStatus(stock: number): ProductStatus {
    if (stock === 0) return 'Немає в наявності';
    if (stock <= 5) return 'Закінчується';
    return 'В наявності';
  }

  async create(dto: CreateInventoryDto): Promise<Product> {
    const cleanDto = {
      ...dto,
      sku: dto.sku.trim(),
      name: dto.name.trim(),
      category: dto.category.trim(),
    };

    const existing = await this.inventoryRepository.findOne({ where: { sku: cleanDto.sku } });
    if (existing) throw new ConflictException(`Товар з SKU "${cleanDto.sku}" вже існує`);

    const product = this.inventoryRepository.create({
      ...cleanDto,
      status: cleanDto.status ?? this.resolveStatus(cleanDto.stock),
    });
    return this.inventoryRepository.save(product);
  }

  async findAll(category?: string, status?: string): Promise<Product[]> {
    const query = this.inventoryRepository.createQueryBuilder('product');

    if (category) {
      query.andWhere('product.category = :category', { category });
    }
    if (status) {
      query.andWhere('product.status = :status', { status });
    }

    return query.orderBy('product.createdAt', 'DESC').getMany();
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.inventoryRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Товар #${id} не знайдений`);
    return product;
  }

  async update(id: number, dto: UpdateInventoryDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, dto);

    // Якщо змінили stock — автооновлення статусу
    if (dto.stock !== undefined && dto.status === undefined) {
      product.status = this.resolveStatus(dto.stock);
    }

    return this.inventoryRepository.save(product);
  }

  async remove(id: number): Promise<{ message: string }> {
    const product = await this.findOne(id);
    await this.inventoryRepository.remove(product);
    return { message: `Товар #${id} видалений` };
  }

  async getStats() {
    const products = await this.inventoryRepository.find();

    let totalItems = 0;
    let totalValue = 0;
    const categoriesSet = new Set<string>();

    products.forEach(p => {
      totalItems += p.stock;
      totalValue += Number(p.price) * p.stock;
      categoriesSet.add(p.category);
    });

    const outOfStock = products.filter(p => p.status === 'Немає в наявності').length;
    const lowStock = products.filter(p => p.status === 'Закінчується').length;

    return { totalItems, totalValue, totalCategories: categoriesSet.size, outOfStock, lowStock };
  }
}