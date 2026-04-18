# Automation Timing Rule

## THE PROBLEM (confirmed Apr 16, 2026)

Simple interval automations (every N hours/days) have NO time anchor.
They fire from whenever they were created — not from a sensible hour.
This causes off-hours messages (midnight, 3am, 4pm instead of 9pm, etc).

## THE FIX — always use one of these two approaches:

### Option A: start_time (for daily/weekly recurring)
Use `start_time="HH:MM"` in LOCAL time (CDT). The platform converts automatically.
Example: `start_time="21:00"` = 9 PM CDT ✅

### Option B: cron_expression (for specific schedules)
Cron is in UTC. CDT = UTC-5, so add 5 hours.
- 8 AM CDT = 13:00 UTC → `0 13 * * *`
- 9 AM CDT = 14:00 UTC → `0 14 * * *`
- 9 PM CDT = 02:00 UTC (next day) → `0 2 * * *`
- Sunday 6 PM CDT = Sunday 23:00 UTC → `0 23 * * 0`

## NEVER DO THIS

```
repeat_interval=6, repeat_unit="hours"   ← fires at midnight, 6am, noon, 6pm randomly
repeat_interval=8, repeat_unit="hours"   ← same problem
```

Always anchor with a start_time or use cron instead.

## QUIET HOURS

Never send WhatsApp messages to Baris between 10 PM and 7 AM CDT.
Any automation that could trigger in that window must be anchored outside it.

## KNOWN PROBLEM AUTOMATIONS (Apr 16)

These are misfiring and need IDs to fix (list_automations truncates, IDs not visible):
- Gmail Batch Summary (every 6h, no anchor) → convert to cron at 10am + 4pm CDT
- GSH Email Intelligence Miner (every 8h, no anchor) → convert to cron at 8am + 2pm CDT
- Evening Curiosity Digest (21:00 UTC = 4pm CDT ❌) → fix to start_time="21:00" local

## HOW TO GET AUTOMATION IDs WHEN LIST TRUNCATES

The list_automations response caps at ~10k chars — only ~7 automations visible.
To find IDs for older automations:
1. Search session logs for the automation name + "create_automation"
2. Read the session where it was created — the ID is in the tool response
3. Save all new automation IDs to memory.md immediately after creation

## RULE: Save IDs to memory on creation

Every time I create an automation, immediately save:
- Name
- ID
- Schedule (what time CDT it fires)

to memory.md so it's never lost.
