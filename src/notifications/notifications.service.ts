import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { PersistNotificationDto } from './dto';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRedis()
    private readonly redis: Redis,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('persist_notification')
  async persistNotification(payload: PersistNotificationDto) {
    const creatorKey = this.getKey(payload.creatorId);

    const notificationIdsString = await this.redis.get(creatorKey);
    const notifications = notificationIdsString
      ? JSON.parse(notificationIdsString).push(payload.notificationId)
      : [payload.notificationId];

    await this.redis.set(creatorKey, JSON.stringify(notifications));

    const notificationKey = this.getKey(
      payload.creatorId,
      payload.notificationId,
    );

    await this.redis.set(
      notificationKey,
      JSON.stringify(payload),
      'EX',
      90 * 24 * 60 * 60,
    );
    this.eventEmitter.emit('notify', payload);
  }

  async getAllNotifications(creatorId: string) {
    const notificationIdsString = await this.redis.get(this.getKey(creatorId));

    const keys = notificationIdsString
      ? JSON.parse(notificationIdsString).map((id: string) =>
          this.getKey(creatorId, id),
        )
      : [];

    return keys.length > 0 ? this.redis.mget(...keys) : [];
  }

  async deleteAllNotifications(creatorId: string) {
    const notificationIdsString = await this.redis.get(this.getKey(creatorId));

    const keys = notificationIdsString
      ? JSON.parse(notificationIdsString).map((id: string) =>
          this.getKey(creatorId, id),
        )
      : [];

    const deletedCount = keys.length > 0 ? await this.redis.del(...keys) : 0;
    return { deletedCount };
  }

  async deleteNotificationById(notificationId: string, creatorId: string) {
    const key = this.getKey(creatorId, notificationId);
    const deletedCount = await this.redis.del(key);
    return { deletedCount };
  }

  private getKey(creatorId: string, notificationId?: string) {
    const prefix = `notifications:${creatorId}`;
    return notificationId ? `${prefix}:${notificationId}` : prefix;
  }
}
