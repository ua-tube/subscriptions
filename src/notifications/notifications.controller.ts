import {
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthUserGuard, AuthUserSseGuard } from '../common/guards';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { PersistNotificationDto } from './dto';
import { ackMessage } from '../common/utils';
import { UserId } from '../common/decorators';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern('persist_notification')
  async handlePersistNotification(
    @Payload() payload: PersistNotificationDto,
    @Ctx() context: RmqContext,
  ) {
    await this.notificationsService.persistNotification(payload);
    ackMessage(context);
  }

  @UseGuards(AuthUserSseGuard)
  @Sse('sse/:userId')
  sse(
    @Param('userId', ParseUUIDPipe) userIdFromPath: string,
    @UserId() userId: string,
  ) {
    if (userIdFromPath !== userId) throw new ForbiddenException();

    return this.notificationsService.sse(userId);
  }

  @UseGuards(AuthUserGuard)
  @Get()
  getAllNotifications(@UserId() userId: string) {
    return this.notificationsService.getAllNotifications(userId);
  }

  @UseGuards(AuthUserGuard)
  @Delete('all')
  deleteAllNotifications(@UserId() userId: string) {
    return this.notificationsService.deleteAllNotifications(userId);
  }

  @UseGuards(AuthUserGuard)
  @Delete('by-id/:id')
  deleteNotificationById(
    @Param('id', ParseUUIDPipe) notificationId: string,
    @UserId() userId: string,
  ) {
    return this.notificationsService.deleteNotificationById(
      notificationId,
      userId,
    );
  }
}
