import { Logger, UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { isEmpty } from 'class-validator';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: { origin: process.env.CLIENT_URL },
  transports: ['websocket', 'polling'],
  namespace: 'notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  private server: Server;

  constructor(private readonly configService: ConfigService) {}

  async handleConnection(socket: Socket) {
    const handshakeAuthorization = socket?.handshake?.headers?.authorization;

    if (isEmpty(handshakeAuthorization)) {
      this.server.to(socket.id).emit('error', new UnauthorizedException());
      return socket.disconnect();
    }

    const split = handshakeAuthorization.split(' ');
    if (split.length < 2) {
      this.server.to(socket.id).emit('error', new UnauthorizedException());
      return socket.disconnect();
    }

    let user: { id: string };
    try {
      const { data } = await axios.get(
        this.configService.get<string>('AUTH_SVC_URL'),
        {
          headers: {
            Authorization: `Bearer ${split[1]}`,
          },
        },
      );
      user = data;
    } catch {
      this.server.to(socket.id).emit('error', new UnauthorizedException());
      return socket.disconnect();
    }

    const room = this.getRoomName(user.id);
    await socket.join(room);
    this.logger.log(
      `User (${user.id}:${socket.id}) connected and join room: ${room}`,
    );
  }

  handleDisconnect(socket: Socket) {
    socket.disconnect();
    this.logger.log(`${socket.id} disconnected`);
  }

  @OnEvent('notify', { async: true, promisify: true })
  async handleNotify(payload: { userId: string; notification: any }) {
    this.logger.log(`notify emit to user (${payload.userId})`);
    this.server
      .to(this.getRoomName(payload.userId))
      .emit('notification', payload.notification);
  }

  private getRoomName(userId: string) {
    return `room-${userId}`;
  }
}
