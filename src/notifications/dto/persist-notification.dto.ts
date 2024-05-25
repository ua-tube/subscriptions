export class PersistNotificationDto {
  notificationId: string;
  creatorId: string;
  message: string;
  url: string;
  channel: {
    nickname: string;
    thumbnailUrl: string;
  };
}
