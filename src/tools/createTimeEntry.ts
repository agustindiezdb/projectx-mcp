import { z } from "zod";
import { getCurrentUser, createTimeEntry as apiCreate, minutesToHours } from "../api/projectx";
import { CreateTimeEntryResult } from "../types";

export const CreateTimeEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  hours: z.number().positive().max(24),
  project: z.string().min(1),
  description: z.string().optional(),
  billable: z.boolean().optional(),
});

export type CreateTimeEntryInput = z.infer<typeof CreateTimeEntrySchema>;

export async function createTimeEntryTool(
  input: CreateTimeEntryInput
): Promise<CreateTimeEntryResult> {
  const validated = CreateTimeEntrySchema.parse(input);

  const user = await getCurrentUser();
  const resourceId = user.resource.id;

  const entry = await apiCreate(resourceId, {
    date: validated.date,
    hours: validated.hours,
    project: validated.project,
    description: validated.description,
    billable: validated.billable,
  });

  return {
    success: true,
    message: `Created: ${minutesToHours(entry.duration)}h on ${entry.date} for "${entry.trackable_name}"${entry.description ? ` — ${entry.description}` : ""}. Entry ID: ${entry.id}`,
    entry,
  };
}
