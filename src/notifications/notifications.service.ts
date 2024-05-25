import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { PersistNotificationDto } from './dto';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRedis()
    private readonly redis: Redis,
  ) {}

  @OnEvent('persist_notification')
  async persistNotification(payload: PersistNotificationDto) {
    await this.redis.set(
      this.getKey(payload.creatorId, payload.notificationId),
      JSON.stringify(payload),
      'EX',
      90 * 24 * 60 * 60,
    );
  }

  async getAllNotifications(creatorId: string) {
    const pattern = this.getKey(creatorId);
    let cursor = '0';
    const notifications = [];

    do {
      const res = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = res[0];
      const keys = res[1];
      if (keys.length > 0) {
        const values = await this.redis.mget(...keys);
        notifications.push(...values);
      }
    } while (cursor !== '0');

    return notifications;
  }

  async deleteAllNotifications(creatorId: string) {
    const pattern = this.getKey(creatorId);
    let cursor = '0';
    let deletedCount = 0;

    do {
      const res = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = res[0];
      const keys = res[1];
      if (keys.length > 0) {
        await this.redis.del(...keys);
        deletedCount += keys.length;
      }
    } while (cursor !== '0');

    return { deletedCount };
  }

  async deleteNotificationById(notificationId: string, creatorId: string) {
    const deletedCount = await this.redis.del(
      this.getKey(creatorId, notificationId),
    );
    return { deletedCount };
  }

  private getKey(creatorId: string, notificationId?: string) {
    return `notifications:${creatorId}:${notificationId || '*'}`;
  }
}
