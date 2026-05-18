import { IsString, IsEmail, IsOptional, IsNumber, IsIn } from 'class-validator';

export class CreateClientDto {
    @IsString()
    name: string;

    @IsString()
    company: string;

    @IsString()
    phone: string;

    @IsEmail()
    email: string;

    @IsOptional()
    @IsIn(['Активний', 'Новий лід', 'В перемовинах'])
    status?: 'Активний' | 'Новий лід' | 'В перемовинах';

    @IsOptional()
    @IsNumber()
    ltv?: number;

    @IsOptional()
    @IsString()
    color?: string;
}