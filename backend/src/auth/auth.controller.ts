import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request, BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

interface ForgotPasswordDto {
  email: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Return JWT access token and user info.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid current password.' })
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    try {
      // JwtStrategy devuelve { userId, email, role }
      const userId = req.user.userId;
      
      if (!userId) {
        throw new BadRequestException('Usuario no identificado');
      }
      
      if (!dto.currentPassword || !dto.newPassword) {
        throw new BadRequestException('Contraseña actual y nueva son requeridas');
      }
      
      const result = await this.authService.changePassword(userId, dto.currentPassword, dto.newPassword);
      if (!result) {
        throw new BadRequestException('Contraseña actual incorrecta');
      }
      return { message: 'Contraseña actualizada correctamente' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error en changePassword:', error);
      throw new BadRequestException('Error al cambiar la contraseña');
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'If email exists, temporary password sent.' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(dto.email);
    // Siempre retornar el mismo mensaje por seguridad (no revelar si el email existe)
    return { 
      message: 'Si el correo está registrado, recibirás una contraseña temporal.',
      success: result,
    };
  }
}

