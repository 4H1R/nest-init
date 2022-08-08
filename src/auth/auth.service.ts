import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ValidationErrorException } from 'src/common/exception/validation.exception';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(registerDto: RegisterDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (user)
      throw new ValidationErrorException({
        email: 'This email has already been taken.',
      });

    const password = await this.hash(registerDto.password);
    const createdUser = await this.prisma.user.create({
      data: { ...registerDto, password },
    });

    return this.generateAccessToken(createdUser);
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) this.throwInvalidCredentials();
    const isValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isValid) this.throwInvalidCredentials();

    return this.generateAccessToken(user);
  }

  generateAccessToken(user: any) {
    delete user.password;

    return {
      accessToken: this.jwt.sign({ email: user.email, sub: user.id }),
      user: { ...user },
    };
  }

  private async hash(password: string) {
    return await bcrypt.hash(password, 10);
  }

  private throwInvalidCredentials() {
    throw new ValidationErrorException({
      email: "These credentials doesn't match our records.",
    });
  }
}
