import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { PersistNotificationDto } from './dto';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { fromEvent, map } from 'rxjs';

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
      ? [...JSON.parse(notificationIdsString), payload.notificationId]
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
    this.eventEmitter.emit(`notify.${payload.creatorId}`, payload);
  }

  async getAllNotifications(creatorId: string) {
    const notificationIdsString = await this.redis.get(this.getKey(creatorId));

    const keys = notificationIdsString
      ? JSON.parse(notificationIdsString)?.map((id: string) =>
          this.getKey(creatorId, id),
        ) || []
      : [];

    const values = keys.length > 0 ? await this.redis.mget(...keys) : [];
    return values.map((v) => JSON.parse(v));
  }

  async deleteAllNotifications(creatorId: string) {
    const notificationIdsString = await this.redis.get(this.getKey(creatorId));

    const keys = notificationIdsString
      ? JSON.parse(notificationIdsString)?.map((id: string) =>
          this.getKey(creatorId, id),
        ) || []
      : [];

    const deletedCount = keys.length > 0 ? await this.redis.del(...keys) : 0;

    if (deletedCount > 0) {
      await this.redis.del(this.getKey(creatorId));
    }

    return { deletedCount };
  }

  async deleteNotificationById(notificationId: string, creatorId: string) {
    const key = this.getKey(creatorId, notificationId);
    const deletedCount = await this.redis.del(key);
    return { deletedCount };
  }

  sse(userId: string) {
    return fromEvent(this.eventEmitter, `notify.${userId}`).pipe(
      map((data) => {
        return data as MessageEvent;
      }),
    );
  }

  private getKey(creatorId: string, notificationId?: string) {
    const prefix = `notifications:${creatorId}`;
    return notificationId ? `${prefix}:${notificationId}` : prefix;
  }
}
