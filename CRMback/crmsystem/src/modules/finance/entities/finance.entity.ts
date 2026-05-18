import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type FinanceType = 'income' | 'expense';

@Entity('finances')
export class Finance {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('decimal', { precision: 10, scale: 2 })
    amount: number;

    @Column()
    type: FinanceType;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    category: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}