import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { User } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { CurrentUser, Public } from './decorator';
import { LoginDto, RegisterDto } from './dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Res({ passthrough: true }) res: Response,
    @Body() registerDto: RegisterDto,
  ) {
    const { refreshToken, ...rest } = await this.authService.register(
      registerDto,
    );
    this.setRefreshTokenCookie(res, refreshToken);
    return rest;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() loginDto: LoginDto,
  ) {
    const { refreshToken, ...rest } = await this.authService.login(loginDto);
    this.setRefreshTokenCookie(res, refreshToken);
    return rest;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request) {
    return this.authService.refresh(req.cookies['refresh']);
  }

  @ApiBearerAuth()
  @Get('me')
  @HttpCode(HttpStatus.OK)
  me(@CurrentUser() user: User) {
    return this.authService.me(user);
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    return res.cookie('refresh', refreshToken, {
      httpOnly: true,
    });
  }
}
