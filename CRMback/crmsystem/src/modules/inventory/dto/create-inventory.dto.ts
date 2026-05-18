import { Type } from 'class-transformer';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class CreateInventoryDto {
    @IsString()
    @IsNotEmpty()
    sku: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    category: string;

    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    price: number;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    stock: number;

    @IsOptional()
    @IsIn(['В наявності', 'Закінчується', 'Немає в наявності'])
    status?: 'В наявності' | 'Закінчується' | 'Немає в наявності';
}
