import { Controller, Get } from '@nestjs/common';
import { TIMEZONE, todayKey } from '../common/date.util';

/**
 * Render's health check target, and the ping the frontend uses to wake the
 * free-tier service before showing the day feed.
 */
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      ok: true,
      serverToday: todayKey(),
      tz: TIMEZONE,
    };
  }
}
