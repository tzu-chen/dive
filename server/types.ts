import { z } from 'zod';

export const bookStatusEnum = z.enum(['want', 'owned', 'reading', 'finished', 'abandoned']);
export type BookStatus = z.infer<typeof bookStatusEnum>;

export const noteKindEnum = z.enum(['quote', 'thought']);
export type NoteKind = z.infer<typeof noteKindEnum>;
