const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/nithi/Downloads/Beyond-Yesterday/beyond-yesterday-app/app/api/cron/sync-wearables/route.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF (\n)
content = content.replace(/\r\n/g, '\n');

// 1. Replace syncFitbit window calculation
const targetWindow = `  const start = connection.last_synced_at
    ? new Date(connection.last_synced_at)
    : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const end = new Date();

  const startTimeMillis = start.getTime();
  const endTimeMillis = end.getTime();
  const startTimeNanos = startTimeMillis + '000000';
  const endTimeNanos = endTimeMillis + '000000';`;

const replacementWindow = `  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const startTimeMillis = startOfDay.getTime();
  const endTimeMillis = now.getTime();
  const startTimeNanos = startTimeMillis + '000000';
  const endTimeNanos = endTimeMillis + '000000';`;

if (content.includes(targetWindow)) {
  content = content.replace(targetWindow, replacementWindow);
  console.log('syncFitbit window calculation updated.');
} else {
  console.error('syncFitbit window calculation target NOT found.');
}

// 2. Replace sleepResponse fetch
const targetSleepFetch = `    const sleepResponse = await fetch(
      \`https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=\${start.toISOString()}&endTime=\${end.toISOString()}&activityType=72\`,`;

const replacementSleepFetch = `    const sleepResponse = await fetch(
      \`https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=\${startOfDay.toISOString()}&endTime=\${now.toISOString()}&activityType=72\`,`;

if (content.includes(targetSleepFetch)) {
  content = content.replace(targetSleepFetch, replacementSleepFetch);
  console.log('sleepResponse fetch url updated.');
} else {
  console.error('sleepResponse fetch url target NOT found.');
}

// 3. Replace last_synced_at connection update in syncFitbit
const targetConnectionUpdate = `    await supabaseAdmin
      .from('wearable_connections')
      .update({ last_synced_at: end.toISOString() })
      .eq('id', connection.id);`;

const replacementConnectionUpdate = `    await supabaseAdmin
      .from('wearable_connections')
      .update({ last_synced_at: now.toISOString() })
      .eq('id', connection.id);`;

if (content.includes(targetConnectionUpdate)) {
  content = content.replace(targetConnectionUpdate, replacementConnectionUpdate);
  console.log('last_synced_at connection update in syncFitbit updated.');
} else {
  console.error('last_synced_at connection update in syncFitbit target NOT found.');
}

// 4. Replace syncWhoop mock simulation
const targetWhoopSim = `  const nowStr = new Date().toISOString();

  // Mock Whoop data simulation
  const stepsVal = Math.round(1500 + Math.random() * 4000);
  const sleepVal = Math.round((6.0 + Math.random() * 3.0) * 10) / 10;
  const hrVal = Math.round(48 + Math.random() * 15);

  const mockLogs = [
    {
      user_id: userId,
      group_id: groupId,
      metric_slug: 'wearable_steps',
      value: stepsVal,
      unit: 'steps',
      status: 'verified',
      logged_at: nowStr,
    },
    {
      user_id: userId,
      group_id: groupId,
      metric_slug: 'wearable_sleep',
      value: sleepVal,
      unit: 'hrs',
      status: 'verified',
      logged_at: nowStr,
    },
    {
      user_id: userId,
      group_id: groupId,
      metric_slug: 'wearable_resting_hr',
      value: hrVal,
      unit: 'bpm',
      status: 'verified',
      logged_at: nowStr,
    },
  ];`;

const replacementWhoopSim = `  const now = new Date();
  const nowStr = now.toISOString();

  // Query today's existing values for progressive updates
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const { data: existingLogs } = await supabaseAdmin
    .from('metric_logs')
    .select('metric_slug, value')
    .eq('user_id', userId)
    .gte('logged_at', startOfDay.toISOString())
    .lt('logged_at', endOfDay.toISOString())
    .eq('status', 'verified');

  const existingSteps = existingLogs?.find((l) => l.metric_slug === 'wearable_steps')?.value;
  const existingSleep = existingLogs?.find((l) => l.metric_slug === 'wearable_sleep')?.value;
  const existingHR = existingLogs?.find((l) => l.metric_slug === 'wearable_resting_hr')?.value;

  const stepsVal = existingSteps !== undefined
    ? Number(existingSteps) + Math.round(500 + Math.random() * 1500)
    : Math.round(1500 + Math.random() * 4000);

  const sleepVal = existingSleep !== undefined
    ? Number(existingSleep)
    : Math.round((6.0 + Math.random() * 3.0) * 10) / 10;

  const hrVal = existingHR !== undefined
    ? Math.round(Number(existingHR) + (Math.random() > 0.5 ? 1 : -1))
    : Math.round(48 + Math.random() * 15);

  const mockLogs = [
    {
      user_id: userId,
      group_id: groupId,
      metric_slug: 'wearable_steps',
      value: stepsVal,
      unit: 'steps',
      status: 'verified',
      logged_at: nowStr,
    },
    {
      user_id: userId,
      group_id: groupId,
      metric_slug: 'wearable_sleep',
      value: sleepVal,
      unit: 'hrs',
      status: 'verified',
      logged_at: nowStr,
    },
    {
      user_id: userId,
      group_id: groupId,
      metric_slug: 'wearable_resting_hr',
      value: hrVal,
      unit: 'bpm',
      status: 'verified',
      logged_at: nowStr,
    },
  ];`;

if (content.includes(targetWhoopSim)) {
  content = content.replace(targetWhoopSim, replacementWhoopSim);
  console.log('syncWhoop mock simulation updated.');
} else {
  console.error('syncWhoop mock simulation target NOT found.');
}

// Convert back to CRLF
const crlfContent = content.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, crlfContent, 'utf8');
console.log('Patches completed successfully.');
