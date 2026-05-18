import { Type } from 'class-transformer';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateFinanceDto {
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    amount: number;

    @IsIn(['income', 'expense'])
    type: 'income' | 'expense';

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsOptional()
    @IsString()
    category?: string;
}
