import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions.service';
import { AuthUserGuard } from '../../common/guards';
import { SubscribeRequestDto } from '../dto';
import { UserId } from '../../common/decorators';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @UseGuards(AuthUserGuard)
  @HttpCode(200)
  @Post('subscribe')
  subscribe(@Body() dto: SubscribeRequestDto, @UserId() userId: string) {
    return this.subscriptionsService.subscribe(userId, dto.targetId);
  }

  @UseGuards(AuthUserGuard)
  @HttpCode(200)
  @Post('unsubscribe')
  unsubscribe(@Body() dto: SubscribeRequestDto, @UserId() userId: string) {
    return this.subscriptionsService.unsubscribe(userId, dto.targetId);
  }

  @UseGuards(AuthUserGuard)
  @Get()
  getSubscriptions(@UserId() userId: string) {
    return this.subscriptionsService.getSubscriptions(userId);
  }

  @UseGuards(AuthUserGuard)
  @Get('status/:targetId')
  getSubscriptionStatus(
    @Param('targetId', ParseUUIDPipe) targetId: string,
    @UserId() userId: string,
  ) {
    return this.subscriptionsService.getSubscriptionStatus(targetId, userId);
  }

  @Get('info/:creatorId')
  getSubscriptionInfo(@Param('creatorId', ParseUUIDPipe) creatorId: string) {
    return this.subscriptionsService.getSubscriptionInfo(creatorId);
  }
}
