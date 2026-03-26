import { z } from "zod";
import { getCurrentUser, getTimeEntries, minutesToHours } from "../api/projectx";
import { GetTimeEntriesResult, DaySummary, TrackedTimeEntry } from "../types";

export const GetTimeEntriesSchema = z.object({
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
});

export type GetTimeEntriesInput = z.infer<typeof GetTimeEntriesSchema>;

export async function getTimeEntriesTool(
  input: GetTimeEntriesInput
): Promise<GetTimeEntriesResult> {
  const validated = GetTimeEntriesSchema.parse(input);

  const user = await getCurrentUser();
  const resourceId = user.resource.id;

  // Calculate number of days needed to cover the range
  const from = new Date(validated.date_from);
  const to = new Date(validated.date_to);
  const daysDiff = Math.ceil((to.getTime() - from.getTime()) / 86400000) + 1;
  // Request enough days from today back to cover the range
  const today = new Date();
  const daysFromToday = Math.ceil((today.getTime() - from.getTime()) / 86400000) + daysDiff + 5;
  const numberOfDays = Math.max(daysFromToday, daysDiff + 5);

  const allEntries = await getTimeEntries(resourceId, { numberOfDays });

  // Filter to the requested range
  const entries = allEntries.filter((e) => {
    return e.date >= validated.date_from && e.date <= validated.date_to;
  });

  // Build per-day summary
  const byDay = new Map<string, TrackedTimeEntry[]>();
  for (const entry of entries) {
    const list = byDay.get(entry.date) ?? [];
    list.push(entry);
    byDay.set(entry.date, list);
  }

  const summary: DaySummary[] = [];
  let cursor = new Date(validated.date_from);
  while (cursor <= to) {
    const dateStr = cursor.toISOString().split("T")[0];
    const dayEntries = byDay.get(dateStr) ?? [];
    summary.push({
      date: dateStr,
      total_hours: dayEntries.reduce((sum, e) => sum + minutesToHours(e.duration), 0),
      entries: dayEntries.map((e) => ({
        id: e.id,
        project: e.trackable_name,
        hours: minutesToHours(e.duration),
        description: e.description,
      })),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const missingDays = summary.filter((d) => d.total_hours === 0);

  return {
    success: true,
    message: `Found ${entries.length} entries from ${validated.date_from} to ${validated.date_to}. ${missingDays.length} days with no entries.`,
    entries,
    summary,
  };
}
