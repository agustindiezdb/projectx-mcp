/**
 * check-april.ts — Check missing days in April 2026
 */

import { getCurrentUser, getTimeEntries, minutesToHours } from "../src/api/projectx";

async function main(): Promise<void> {
  console.log("Checking April 2026...\n");

  const user = await getCurrentUser();
  const entries = await getTimeEntries(user.resource.id, { numberOfDays: 90 });

  // Group entries by date
  const entriesByDate = new Map<string, typeof entries>();
  for (const entry of entries) {
    const date = entry.date; // Already YYYY-MM-DD
    if (!entriesByDate.has(date)) {
      entriesByDate.set(date, []);
    }
    entriesByDate.get(date)!.push(entry);
  }

  // Generate all days in April 2026
  const aprilDays: string[] = [];
  for (let day = 1; day <= 30; day++) {
    aprilDays.push(`2026-04-${String(day).padStart(2, '0')}`);
  }

  console.log("Days in April 2026:\n");
  
  const missing: string[] = [];
  
  for (const date of aprilDays) {
    const dayEntries = entriesByDate.get(date) || [];
    const totalHours = dayEntries.reduce((sum, e) => sum + minutesToHours(e.duration), 0);
    
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
    
    if (totalHours === 0) {
      console.log(`${date} (${dayOfWeek}) ❌ MISSING`);
      missing.push(date);
    } else {
      console.log(`${date} (${dayOfWeek}) ✅ ${totalHours}h`);
      for (const e of dayEntries) {
        console.log(`    • ${e.trackable_name} — ${minutesToHours(e.duration)}h`);
      }
    }
  }

  console.log(`\nSummary: ${missing.length} missing days in April`);
  if (missing.length > 0) {
    console.log(`Missing: ${missing.join(', ')}`);
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
