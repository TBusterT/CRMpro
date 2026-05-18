import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type ClientStatus = 'Активний' | 'Новий лід' | 'В перемовинах';

@Entity('clients')
export class Client {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    company: string;

    @Column()
    phone: string;

    @Column({ unique: true })
    email: string;

    @Column({ default: 'Новий лід' })
    status: ClientStatus;

    @Column({ default: 0 })
    ltv: number;

    @Column({ default: '#3b82f6' })
    color: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}