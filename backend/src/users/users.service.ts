import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { User, Role } from '@prisma/client';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Al iniciar el módulo, aseguramos que existe el gestor UTPL
   */
  async onModuleInit() {
    await this.ensureGestorExists();
  }

  /**
   * Crea o actualiza el gestor UTPL (usuario único del sistema)
   * Las credenciales se configuran en variables de entorno
   */
  async ensureGestorExists(): Promise<User> {
    const gestorEmail = this.configService.get<string>('gestor.email') || 'gestor@utpl.edu.ec';
    const gestorName = this.configService.get<string>('gestor.name') || 'Gestor UTPL';
    const gestorPassword = this.configService.get<string>('gestor.password') || 'GestorUTPL2025!';

    const existingGestor = await this.prisma.user.findUnique({
      where: { email: gestorEmail },
    });

    if (existingGestor) {
      this.logger.log(`Gestor UTPL encontrado: ${gestorEmail}`);
      return existingGestor;
    }

    // Crear el gestor si no existe
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(gestorPassword, salt);

    const gestor = await this.prisma.user.create({
      data: {
        email: gestorEmail,
        name: gestorName,
        role: Role.GESTOR,
        passwordHash,
        isActive: true,
      },
    });

    this.logger.log(`Gestor UTPL creado: ${gestorEmail}`);
    return gestor;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(createUserDto.password, salt);

    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        role: createUserDto.role,
        passwordHash,
      },
    });
  }

  async findOne(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        passwordHash: false,
      },
    }) as unknown as User[];
  }

  async updatePassword(id: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }
}

