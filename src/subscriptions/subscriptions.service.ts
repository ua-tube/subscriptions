import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe(creatorId: string, targetId: string) {
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
        Target: {
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
    const subscription = await this.prisma.creator.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        displayName: true,
        nickname: true,
        thumbnailUrl: true,
        subscribersCount: true,
      },
    });

    subscription.subscribersCount = `${subscription.subscribersCount}` as any;

    return subscription;
  }
}
