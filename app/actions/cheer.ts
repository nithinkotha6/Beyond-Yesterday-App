'use server';

/**
 * Server Action stub for sending cheers/taunts to a user on the leaderboard.
 * Logs the event on the server and returns a lightweight notification message.
 */
export async function sendCheer(userId: string, targetName: string, metricLabel: string) {
  console.log(`[Social Cheer] Cheer sent for ${metricLabel} to user ${targetName} (${userId})`);
  return {
    success: true,
    message: `Sent 🔥 to ${targetName}!`,
  };
}
