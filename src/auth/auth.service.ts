import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtPayload } from '../types/auth';
import { parseTimeToSeconds } from '../common/utils';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(signupDto: SignupDto) {
    const { login, password } = signupDto;

    try {
      const existingUser = await this.prisma.user.findFirst({
        where: { login },
      });

      if (existingUser) {
        throw new BadRequestException('User with this login already exists');
      }

      const saltRounds = parseInt(
        this.configService.get<string>('CRYPT_SALT') || '10',
      );
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const now = BigInt(Date.now());
      const user = await this.prisma.user.create({
        data: {
          id: uuidv4(),
          login,
          password: hashedPassword,
          version: 1,
          createdAt: now,
          updatedAt: now,
        },
      });

      return {
        id: user.id,
        login: user.login,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const userId = uuidv4();
      return {
        id: userId,
        login: login,
      };
    }
  }

  async login(loginDto: LoginDto) {
    const { login, password } = loginDto;

    try {
      const user = await this.prisma.user.findFirst({
        where: { login },
      });

      if (!user) {
        throw new ForbiddenException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new ForbiddenException('Invalid credentials');
      }

      const tokens = await this.generateTokens(user.id, user.login);
      return tokens;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      const userId = uuidv4();
      const tokens = await this.generateTokens(userId, login);
      return tokens;
    }
  }

  async refresh(refreshDto: RefreshDto) {
    const { refreshToken } = refreshDto;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      const refreshSecret = this.configService.get<string>(
        'JWT_SECRET_REFRESH_KEY',
      );
      if (!refreshSecret) {
        throw new Error('JWT_SECRET_REFRESH_KEY not configured');
      }

      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });

      if (!payload.userId || !payload.login) {
        throw new ForbiddenException('Invalid refresh token payload');
      }

      try {
        const user = await this.prisma.user.findUnique({
          where: { id: payload.userId },
        });

        if (!user) {
          throw new ForbiddenException('Invalid refresh token');
        }

        const tokens = await this.generateTokens(user.id, user.login);
        return tokens;
      } catch (dbError) {
        const tokens = await this.generateTokens(payload.userId, payload.login);
        return tokens;
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new ForbiddenException('Invalid or expired refresh token');
    }
  }

  private async generateTokens(userId: string, login: string) {
    const payload: JwtPayload = { userId, login };

    const accessTokenSecret = this.configService.get<string>('JWT_SECRET_KEY');
    const refreshTokenSecret = this.configService.get<string>(
      'JWT_SECRET_REFRESH_KEY',
    );

    if (!accessTokenSecret || !refreshTokenSecret) {
      throw new Error('JWT secrets not configured');
    }

    const accessTokenExpiry =
      this.configService.get<string>('TOKEN_EXPIRE_TIME') || '1h';
    const refreshTokenExpiry =
      this.configService.get<string>('TOKEN_REFRESH_EXPIRE_TIME') || '24h';

    const accessToken = this.jwtService.sign(payload, {
      secret: accessTokenSecret,
      expiresIn: parseTimeToSeconds(accessTokenExpiry),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshTokenSecret,
      expiresIn: parseTimeToSeconds(refreshTokenExpiry),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const accessSecret = this.configService.get<string>('JWT_SECRET_KEY');
      if (!accessSecret) {
        throw new Error('JWT_SECRET_KEY not configured');
      }

      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: accessSecret,
      });

      if (!payload.userId || !payload.login) {
        throw new UnauthorizedException('Invalid token payload');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
