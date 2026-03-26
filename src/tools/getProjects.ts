import { z } from "zod";
import { getProjects } from "../api/projectx";
import { Trackable } from "../types";

export const GetProjectsSchema = z.object({
  search: z.string().optional(),
});

export type GetProjectsInput = z.infer<typeof GetProjectsSchema>;

export interface GetProjectsResult {
  success: boolean;
  message: string;
  projects?: Array<{ id: number; name: string; billable: boolean }>;
}

export async function getProjectsTool(
  input: GetProjectsInput = {}
): Promise<GetProjectsResult> {
  const validated = GetProjectsSchema.parse(input);

  const projects = await getProjects(validated.search);
  const active = projects.filter((p) => p.state === "active");

  return {
    success: true,
    message: `Found ${active.length} active projects${validated.search ? ` matching "${validated.search}"` : ""}.`,
    projects: active.map((p) => ({
      id: p.id,
      name: p.name,
      billable: p.billable,
    })),
  };
}
