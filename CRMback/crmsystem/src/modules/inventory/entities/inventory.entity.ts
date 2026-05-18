import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type ProductStatus = 'В наявності' | 'Закінчується' | 'Немає в наявності';

@Entity('inventory')
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    sku: string;

    @Column()
    name: string;

    @Column()
    category: string;

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;

    @Column({ type: 'int', default: 0 })
    stock: number;

    @Column({ default: 'В наявності' })
    status: ProductStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}