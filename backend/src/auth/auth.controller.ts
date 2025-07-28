import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { AuthService, LoginDto } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.authService.login(loginDto);

      if (result.success) {
        return {
          success: true,
          message: result.message,
          user: result.user,
        };
      } else {
        throw new HttpException(
          {
            success: false,
            message: result.message,
          },
          HttpStatus.UNAUTHORIZED,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Login controller hatası:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Giriş işlemi sırasında bir hata oluştu',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
