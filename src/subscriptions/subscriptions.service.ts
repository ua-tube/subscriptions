import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PersistNotificationEvent } from '../common/events';
import { randomUUID } from 'crypto';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async subscribe(creatorId: string, targetId: string) {
    const [creator, target] = await this.prisma.$transaction([
      this.prisma.creator.findUnique({
        where: { id: creatorId },
        select: { nickname: true },
      }),
      this.prisma.creator.findUnique({
        where: { id: targetId },
        select: {
          nickname: true,
          displayName: true,
          thumbnailUrl: true,
        },
      }),
    ]);

    if (!creator) {
      throw new BadRequestException('Creator not found');
    }

    if (!target) {
      throw new BadRequestException('Target not found');
    }

    if (creatorId === targetId) {
      throw new BadRequestException(
        'Subscribing your own self is not supported',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.create({
        data: { creatorId, targetId },
      });
      await Promise.allSettled([
        tx.creator.update({
          where: { id: creatorId },
          data: { subscriptionsCount: { increment: 1 } },
        }),
        tx.creator.update({
          where: { id: targetId },
          data: { subscribersCount: { increment: 1 } },
        }),
      ]);
    });

    this.eventEmitter.emit(
      'persist_notification',
      new PersistNotificationEvent({
        notificationId: randomUUID(),
        creatorId,
        message: `${target.displayName} підписався на вас!`,
        url: `/channel/${target.nickname}`,
        channel: {
          nickname: target.nickname,
          thumbnailUrl: target.thumbnailUrl,
        },
      }),
    );
  }

  async unsubscribe(creatorId: string, targetId: string) {
    if (creatorId === targetId) {
      throw new BadRequestException(
        'Subscribing your own self is not supported',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await this.prisma.subscription.delete({
        where: { creatorId_targetId: { creatorId, targetId } },
      });
      await Promise.allSettled([
        tx.creator.update({
          where: { id: creatorId },
          data: { subscriptionsCount: { decrement: 1 } },
        }),
        tx.creator.update({
          where: { id: targetId },
          data: { subscribersCount: { decrement: 1 } },
        }),
      ]);
    });
  }

  async getSubscriptions(creatorId: string) {
    return this.prisma.subscription.findMany({
      where: { creatorId },
      select: {
        target: {
          select: {
            id: true,
            displayName: true,
            nickname: true,
            thumbnailUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getSubscriptionStatus(targetId: string, creatorId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { creatorId_targetId: { creatorId, targetId } },
    });
    return { status: !!subscription };
  }

  async getSubscriptionInfo(creatorId: string) {
    const creator = await this.prisma.creator.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        displayName: true,
        nickname: true,
        thumbnailUrl: true,
        subscribersCount: true,
      },
    });

    if (!creator) throw new BadRequestException('Creator not found');

    return {
      ...creator,
      subscribersCount: creator.subscribersCount.toString(),
    };
  }
}
