import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import Joi from 'joi';
import { LoggingInterceptor } from './common/interceptors';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CreatorsModule } from './creators/creators.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.valid('development', 'production', 'test').required(),
        CLIENT_URL: Joi.string().required(),
        HTTP_HOST: Joi.string().required(),
        HTTP_PORT: Joi.number().required(),
        AUTH_SVC_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        DATABASE_URL: Joi.string().required(),
        RABBITMQ_URL: Joi.string().required(),
      }),
    }),
    CreatorsModule,
    SubscriptionsModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
