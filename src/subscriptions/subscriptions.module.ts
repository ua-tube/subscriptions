import { Module } from '@nestjs/common';
import { HealthController, SubscriptionsController } from './controllers';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaModule } from '../prisma';

@Module({
  imports: [PrismaModule],
  controllers: [SubscriptionsController, HealthController],
  providers: [SubscriptionsService],
})
export class SubscriptionsModule {}
