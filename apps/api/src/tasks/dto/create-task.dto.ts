import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { DAY_KEY_PATTERN } from '../../common/date.util';
import { DayPart, Urgency } from '../../common/types';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  /** Omit or send null for a whole-day ("Anytime") task. */
  @IsOptional()
  @IsEnum(DayPart)
  dayPart?: DayPart | null;

  @IsOptional()
  @IsEnum(Urgency)
  urgency?: Urgency;

  /** Defaults to today in Algeria. Forced to null when urgency is SOMEDAY. */
  @IsOptional()
  @Matches(DAY_KEY_PATTERN, { message: 'date must be YYYY-MM-DD' })
  date?: string | null;
}

export class ListTasksQueryDto {
  @IsOptional()
  @Matches(DAY_KEY_PATTERN)
  date?: string;

  @IsOptional()
  @Matches(DAY_KEY_PATTERN)
  from?: string;

  @IsOptional()
  @Matches(DAY_KEY_PATTERN)
  to?: string;

  @IsOptional()
  @IsEnum(Urgency)
  urgency?: Urgency;

  @IsOptional()
  @IsInt()
  includeArchived?: number;
}
