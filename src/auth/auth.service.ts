import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from 'src/prisma/prisma.service';
import { ValidationErrorException } from 'src/common/exception';
import { LoginDto, RegisterDto } from './dto';
import { exclude } from 'src/utils';
import { PayloadEntity } from './entity';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  public async register(registerDto: RegisterDto) {
    const { name, password, email } = registerDto;
    const lowercasedEmail = email.toLocaleLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: lowercasedEmail },
    });

    if (user)
      throw new ValidationErrorException({
        email: 'This email has already been taken.',
      });

    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUser = await this.prisma.user.create({
      data: {
        ...registerDto,
        email: lowercasedEmail,
        password: hashedPassword,
      },
    });

    return this.createAuthResponse(createdUser);
  }

  public async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) this.throwInvalidCredentials();
    const passwordsMatch = await bcrypt.compare(password, user.password);
    if (!passwordsMatch) this.throwInvalidCredentials();

    return this.createAuthResponse(user);
  }

  public async refresh(refreshToken: string) {
    try {
      const token = this.jwt.verify(refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: token.sub },
      });

      const tokens = this.createAuthResponse(user);
      return exclude(tokens, 'refreshToken');
    } catch (e) {
      // token is not signed by us
      throw new UnauthorizedException();
    }
  }

  public me(user: User) {
    return exclude(user, 'password');
  }

  private createAuthResponse(user: User) {
    const payload: PayloadEntity = { sub: user.id };

    return {
      accessToken: this.jwt.sign(payload),
      refreshToken: this.jwt.sign(payload, { expiresIn: '1w' }),
      user: this.me(user),
    };
  }

  private throwInvalidCredentials() {
    throw new ValidationErrorException({
      email: "These credentials doesn't match our records.",
    });
  }
}
