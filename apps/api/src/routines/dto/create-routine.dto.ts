import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { DAY_KEY_PATTERN } from '../../common/date.util';
import { DayPart, Repeat, Urgency } from '../../common/types';

export class CreateRoutineDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsEnum(DayPart)
  dayPart?: DayPart | null;

  @IsOptional()
  @IsEnum(Urgency)
  urgency?: Urgency;

  @IsOptional()
  @IsEnum(Repeat)
  repeat?: Repeat;

  /** Only meaningful when repeat is WEEKLY. 0 = Sunday. */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  @Type(() => Number)
  weekdays?: number[];

  /** Defaults to today — a routine never applies retroactively. */
  @IsOptional()
  @Matches(DAY_KEY_PATTERN, { message: 'startDate must be YYYY-MM-DD' })
  startDate?: string;

  @IsOptional()
  @Matches(DAY_KEY_PATTERN, { message: 'endDate must be YYYY-MM-DD' })
  endDate?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
