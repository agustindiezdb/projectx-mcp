import { z } from "zod";
import { getCurrentUser, deleteTimeEntry as apiDelete } from "../api/projectx";
import { DeleteTimeEntryResult } from "../types";

export const DeleteTimeEntrySchema = z.object({
  entry_id: z.number().int().positive(),
});

export type DeleteTimeEntryInput = z.infer<typeof DeleteTimeEntrySchema>;

export async function deleteTimeEntryTool(
  input: DeleteTimeEntryInput
): Promise<DeleteTimeEntryResult> {
  const validated = DeleteTimeEntrySchema.parse(input);

  const user = await getCurrentUser();
  const resourceId = user.resource.id;

  await apiDelete(resourceId, validated.entry_id);

  return {
    success: true,
    message: `Entry ${validated.entry_id} deleted successfully.`,
  };
}
