import { apiRequest } from "./client";
import {
  CurrentUser,
  TrackedTimeEntry,
  Trackable,
  CreateTimeEntryInput,
} from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** YYYY-MM-DD → DD-MM-YYYY (format expected by the POST API) */
function toApiDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}-${m}-${y}`;
}

/** decimal hours → minutes */
function hoursToMinutes(hours: number): number {
  return Math.round(hours * 60);
}

/** minutes → decimal hours */
export function minutesToHours(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100;
}

// ─── Current user ─────────────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<CurrentUser> {
  const data = await apiRequest<{ user: CurrentUser }>("/current_user");
  return data.user;
}

// ─── Projects / Trackables ────────────────────────────────────────────────────

export async function getProjects(search?: string): Promise<Trackable[]> {
  const nameFilter = search ? encodeURIComponent(search) : "";
  const qs = `paginated=false&q%5Bname_cont%5D=${nameFilter}&q%5Bs%5D=name%20asc`;
  const data = await apiRequest<{ trackables: Trackable[] }>(
    `/time_tracker/trackables?${qs}`
  );
  return data.trackables ?? [];
}

export async function findProject(
  resourceId: number,
  nameQuery: string
): Promise<Trackable> {
  const projects = await getProjects(nameQuery);
  const active = projects.filter((p) => p.state === "active");

  if (active.length === 0) {
    throw new Error(
      `No active project found matching "${nameQuery}". Use get_projects to see available projects.`
    );
  }

  // Exact match first
  const exact = active.find(
    (p) => p.name.toLowerCase() === nameQuery.toLowerCase()
  );
  if (exact) return exact;

  // Partial match
  const partial = active.find((p) =>
    p.name.toLowerCase().includes(nameQuery.toLowerCase())
  );
  if (partial) return partial;

  throw new Error(
    `No project matched "${nameQuery}". Found: ${active.map((p) => p.name).join(", ")}`
  );
}

// ─── Time entries ─────────────────────────────────────────────────────────────

export async function getTimeEntries(
  resourceId: number,
  options: { numberOfDays?: number } = {}
): Promise<TrackedTimeEntry[]> {
  const days = options.numberOfDays ?? 30;
  const qs = `number_of_days=${days}&q%5Bs%5D=date%20desc`;
  const data = await apiRequest<{ tracked_time_entries: TrackedTimeEntry[] }>(
    `/resources/${resourceId}/tracked_time_entries?${qs}`
  );
  return data.tracked_time_entries ?? [];
}

export async function createTimeEntry(
  resourceId: number,
  input: CreateTimeEntryInput
): Promise<TrackedTimeEntry> {
  const project = await findProject(resourceId, input.project);

  const body = {
    description: input.description ?? "",
    billable: input.billable ?? project.billable,
    date: toApiDate(input.date),          // DD-MM-YYYY
    duration: hoursToMinutes(input.hours), // minutes
    trackable_id: project.id,
    trackable_type: "Project",
    tag_ids: input.tag_ids ?? [],
  };

  console.error(`[projectx] creating entry:`, body);

  const data = await apiRequest<{ tracked_time_entry: TrackedTimeEntry }>(
    `/resources/${resourceId}/tracked_time_entries`,
    { method: "POST", body }
  );

  return data.tracked_time_entry;
}

export async function deleteTimeEntry(
  resourceId: number,
  entryId: number
): Promise<void> {
  await apiRequest(
    `/resources/${resourceId}/tracked_time_entries/${entryId}`,
    { method: "DELETE" }
  );
}
