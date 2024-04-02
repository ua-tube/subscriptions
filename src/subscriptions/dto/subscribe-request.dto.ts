import { IsNotEmpty, IsUUID } from 'class-validator';

export class SubscribeRequestDto {
  @IsNotEmpty()
  @IsUUID('4')
  public readonly targetId: string;
}
