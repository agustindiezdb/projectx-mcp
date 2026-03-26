// ─── API shapes ───────────────────────────────────────────────────────────────

export interface CurrentUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  resource: {
    id: number;
    first_name: string;
    last_name: string;
    state: string;
  };
}

export interface TrackedTimeEntry {
  id: number;
  resource_id: number;
  description: string | null;
  billable: boolean;
  date: string; // YYYY-MM-DD in responses
  duration: number; // minutes
  tags: Tag[];
  trackable_id: number;
  trackable_type: string;
  trackable_name: string;
  week_number: number;
  week_range: [string, string];
  task: null | { id: number; name: string };
}

export interface Tag {
  id: number;
  name: string;
  state: string;
}

export interface Trackable {
  id: number;
  name: string;
  billable: boolean;
  type: string;
  state: string;
  tasks: Task[];
}

export interface Task {
  id: number;
  project_id: number;
  name: string;
  state: string;
}

// ─── Tool inputs / outputs ────────────────────────────────────────────────────

export interface CreateTimeEntryInput {
  date: string;        // YYYY-MM-DD
  hours: number;       // decimal, e.g. 8 or 7.5
  project: string;     // project name or partial match
  description?: string;
  billable?: boolean;
  tag_ids?: number[];
}

export interface CreateTimeEntryResult {
  success: boolean;
  message: string;
  entry?: TrackedTimeEntry;
}

export interface GetTimeEntriesInput {
  date_from: string;   // YYYY-MM-DD
  date_to: string;     // YYYY-MM-DD
}

export interface GetTimeEntriesResult {
  success: boolean;
  message: string;
  entries?: TrackedTimeEntry[];
  summary?: DaySummary[];
}

export interface DaySummary {
  date: string;
  total_hours: number;
  entries: Array<{
    id: number;
    project: string;
    hours: number;
    description: string | null;
  }>;
}

export interface DeleteTimeEntryResult {
  success: boolean;
  message: string;
}
