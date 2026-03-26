/**
 * test-entry.ts — tests the API client directly (no MCP, no Playwright)
 * Usage: npm run test:entry
 */

import { getCurrentUser, getTimeEntries, createTimeEntry, deleteTimeEntry, getProjects, minutesToHours } from "../src/api/projectx";

async function main(): Promise<void> {
  console.log("─────────────────────────────────────────────");
  console.log("  ProjectX MCP — API Client Test");
  console.log("─────────────────────────────────────────────\n");

  // 1. Current user
  console.log("1. Current user...");
  const user = await getCurrentUser();
  console.log(`   → ${user.first_name} ${user.last_name} (user_id: ${user.id}, resource_id: ${user.resource.id})\n`);

  // 2. Projects
  console.log("2. Projects...");
  const projects = await getProjects();
  const active = projects.filter((p) => p.state === "active");
  console.log(`   → ${active.length} active projects:`);
  active.forEach((p) => console.log(`     [${p.id}] ${p.name} (billable: ${p.billable})`));
  console.log();

  // 3. Recent entries
  console.log("3. Recent entries (last 7 days)...");
  const entries = await getTimeEntries(user.resource.id, { numberOfDays: 7 });
  console.log(`   → ${entries.length} entries:`);
  entries.slice(0, 5).forEach((e) =>
    console.log(`     [${e.id}] ${e.date} — ${e.trackable_name} ${minutesToHours(e.duration)}h — "${e.description}"`)
  );
  console.log();

  // 4. Create a test entry (today, 1h, first billable project)
  const testProject = active.find((p) => p.billable) ?? active[0];
  if (!testProject) {
    console.log("No projects available, skipping create test.");
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  console.log(`4. Creating test entry: 1h on ${today} for "${testProject.name}"...`);
  const created = await createTimeEntry(user.resource.id, {
    date: today,
    hours: 1,
    project: testProject.name,
    description: "MCP API test entry — safe to delete",
  });
  console.log(`   → Created entry ID: ${created.id}\n`);

  // 5. Delete it
  console.log(`5. Deleting test entry ${created.id}...`);
  await deleteTimeEntry(user.resource.id, created.id);
  console.log(`   → Deleted\n`);

  console.log("─────────────────────────────────────────────");
  console.log("  All tests passed ✓");
  console.log("─────────────────────────────────────────────");
}

main().catch((err) => {
  console.error("Test failed:", err.message);
  process.exit(1);
});
