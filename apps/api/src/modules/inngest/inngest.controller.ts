import { All, Controller, Req, Res } from '@nestjs/common';
import { serve } from 'inngest/express';
import { inngest } from '@jobboard/inngest';
import {
  onApplicationSubmitted,
  onApplicationStatusChanged,
  jobExpiringSoon,
  jobExpired,
} from '@jobboard/inngest';
import { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';

const handler = serve({
  client: inngest,
  functions: [
    onApplicationSubmitted,
    onApplicationStatusChanged,
    jobExpiringSoon,
    jobExpired,
  ],
});

/**
 * Inngest uses its own signature verification — @Public() is safe here.
 * In production, Inngest verifies the INNGEST_SIGNING_KEY env var.
 */
@Public()
@Controller('api/inngest')
export class InngestController {
  @All()
  handle(@Req() req: Request, @Res() res: Response) {
    return handler(req, res);
  }
}
