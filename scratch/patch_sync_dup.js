const fs = require('fs');

const filePath = 'c:/Users/nithi/Downloads/Beyond-Yesterday/beyond-yesterday-app/app/api/cron/sync-wearables/route.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

// 1. Rename in syncFitbit
const targetFitbitDedupe = `    for (const log of verifiedLogs) {
      const d = new Date(log.logged_at);
      const startOfDay = new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
      ).toISOString();
      const endOfDay = new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1)
      ).toISOString();

      await supabaseAdmin
        .from('metric_logs')
        .delete()
        .eq('user_id', log.user_id)
        .eq('metric_slug', log.metric_slug)
        .gte('logged_at', startOfDay)
        .lt('logged_at', endOfDay);
    }`;

const replacementFitbitDedupe = `    for (const log of verifiedLogs) {
      const d = new Date(log.logged_at);
      const utcStartOfDay = new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
      ).toISOString();
      const utcEndOfDay = new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1)
      ).toISOString();

      await supabaseAdmin
        .from('metric_logs')
        .delete()
        .eq('user_id', log.user_id)
        .eq('metric_slug', log.metric_slug)
        .gte('logged_at', utcStartOfDay)
        .lt('logged_at', utcEndOfDay);
    }`;

if (content.includes(targetFitbitDedupe)) {
  content = content.replace(targetFitbitDedupe, replacementFitbitDedupe);
  console.log('syncFitbit deduplication scope resolved.');
} else {
  console.error('syncFitbit deduplication target NOT found.');
}

// 2. Rename in syncWhoop
const targetWhoopDedupe = `  // Truncate time and delete existing duplicate logs for the current calendar day (UTC)
  const d = new Date();
  const startOfDay = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  ).toISOString();
  const endOfDay = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1)
  ).toISOString();

  for (const log of verifiedLogs) {
    await supabaseAdmin
      .from('metric_logs')
      .delete()
      .eq('user_id', userId)
      .eq('metric_slug', log.metric_slug)
      .gte('logged_at', startOfDay)
      .lt('logged_at', endOfDay);
  }`;

const replacementWhoopDedupe = `  // Truncate time and delete existing duplicate logs for the current calendar day (UTC)
  const d = new Date();
  const utcStartOfDay = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  ).toISOString();
  const utcEndOfDay = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1)
  ).toISOString();

  for (const log of verifiedLogs) {
    await supabaseAdmin
      .from('metric_logs')
      .delete()
      .eq('user_id', userId)
      .eq('metric_slug', log.metric_slug)
      .gte('logged_at', utcStartOfDay)
      .lt('logged_at', utcEndOfDay);
  }`;

if (content.includes(targetWhoopDedupe)) {
  content = content.replace(targetWhoopDedupe, replacementWhoopDedupe);
  console.log('syncWhoop deduplication scope resolved.');
} else {
  console.error('syncWhoop deduplication target NOT found.');
}

// Save back
const crlfContent = content.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, crlfContent, 'utf8');
console.log('Done.');
