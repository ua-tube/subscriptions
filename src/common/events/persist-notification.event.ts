import { randomUUID } from 'node:crypto';

interface PersistNotificationConstructor {
  creatorId: string;
  message: string;
  url: string;
  channel: {
    nickname: string;
    thumbnailUrl: string;
  };
}

export class PersistNotificationEvent
  implements PersistNotificationConstructor
{
  notificationId: string;
  creatorId: string;
  message: string;
  url: string;
  channel: {
    nickname: string;
    thumbnailUrl: string;
  };

  constructor(notification: PersistNotificationConstructor) {
    this.notificationId = randomUUID();
    this.creatorId = notification.creatorId;
    this.message = notification.message;
    this.url = notification.url;
    this.channel = notification.channel;
  }
}
