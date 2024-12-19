import { HttpStatus } from '@nestjs/common';

export interface ReturnInterface {
  status: HttpStatus;
  message: string | null | object;
}
