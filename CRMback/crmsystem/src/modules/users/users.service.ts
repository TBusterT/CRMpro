import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

export type PublicUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<PublicUser> {
    const normalizedEmail = createUserDto.email.toLowerCase().trim();
    const existingUser = await this.usersRepository.findOne({ where: { email: normalizedEmail } });

    if (existingUser) {
      throw new ConflictException('Користувач з таким email вже існує');
    }

    const user = this.usersRepository.create({
      fullName: createUserDto.fullName.trim(),
      email: normalizedEmail,
      passwordHash: this.hashPassword(createUserDto.password),
      role: createUserDto.role ?? 'manager',
    });

    const savedUser = await this.usersRepository.save(user);
    return this.toPublicUser(savedUser);
  }

  async findAll(): Promise<PublicUser[]> {
    const users = await this.usersRepository.find({ order: { id: 'ASC' } });
    return users.map((user) => this.toPublicUser(user));
  }

  async findOne(id: number): Promise<PublicUser> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Користувача не знайдено');
    return this.toPublicUser(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email: email.toLowerCase().trim() } });
  }

  async findEntityById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<PublicUser> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Користувача не знайдено');

    if (updateUserDto.email && updateUserDto.email.toLowerCase().trim() !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) throw new ConflictException('Користувач з таким email вже існує');
      user.email = updateUserDto.email.toLowerCase().trim();
    }

    if (updateUserDto.fullName) user.fullName = updateUserDto.fullName.trim();
    if (updateUserDto.password) user.passwordHash = this.hashPassword(updateUserDto.password);
    if (updateUserDto.role) user.role = updateUserDto.role;

    const savedUser = await this.usersRepository.save(user);
    return this.toPublicUser(savedUser);
  }

  async remove(id: number) {
    const result = await this.usersRepository.delete(id);
    if (!result.affected) throw new NotFoundException('Користувача не знайдено');
    return { message: 'Користувача видалено' };
  }

  verifyPassword(password: string, passwordHash: string): boolean {
    const [salt, originalHash] = passwordHash.split(':');
    const hash = pbkdf2Sync(password, salt, 100_000, 64, 'sha512').toString('hex');
    return timingSafeEqual(Buffer.from(hash), Buffer.from(originalHash));
  }

  toPublicUser(user: User): PublicUser {
    const { passwordHash, ...publicUser } = user;
    return publicUser;
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(password, salt, 100_000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }
}
