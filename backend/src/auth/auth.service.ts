import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
      },
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      this.logger.log(`Intentando cambiar contraseña para usuario: ${userId}`);
      
      const user = await this.usersService.findOne(userId);
      if (!user) {
        this.logger.warn(`Usuario no encontrado: ${userId}`);
        return false;
      }

      // Verificar contraseña actual
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        this.logger.warn(`Contraseña actual incorrecta para usuario: ${userId}`);
        return false;
      }

      // Actualizar contraseña
      const salt = await bcrypt.genSalt();
      const newHash = await bcrypt.hash(newPassword, salt);
      await this.usersService.updatePassword(userId, newHash);
      
      this.logger.log(`Contraseña actualizada exitosamente para usuario: ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error al cambiar contraseña: ${error.message}`);
      throw error;
    }
  }

  /**
   * Genera una contraseña temporal y la envía por correo
   */
  async forgotPassword(email: string): Promise<boolean> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        this.logger.warn(`Intento de recuperación para email no registrado: ${email}`);
        return false;
      }

      // Generar contraseña temporal (8 caracteres alfanuméricos)
      const tempPassword = this.generateTempPassword();
      
      // Hashear y guardar
      const salt = await bcrypt.genSalt();
      const newHash = await bcrypt.hash(tempPassword, salt);
      await this.usersService.updatePassword(user.id, newHash);

      // Enviar correo con la contraseña temporal
      await this.mailService.sendTempPassword(user.email, user.name, tempPassword);

      this.logger.log(`Contraseña temporal enviada a: ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Error en forgotPassword: ${error.message}`);
      return false;
    }
  }

  /**
   * Genera una contraseña temporal segura
   */
  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

