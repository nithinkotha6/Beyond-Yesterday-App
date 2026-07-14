/**
 * Server-side utility to communicate with Green API.
 * Sends a WhatsApp message to the configured group chat.
 * Spec: CLAUDE.md & prompt description (Pillar 1)
 */
export async function sendWhatsAppGroupMessage(message: string): Promise<boolean> {
  const instanceId = process.env.GREEN_API_INSTANCE_ID;
  const token = process.env.GREEN_API_TOKEN;
  const chatId = process.env.WHATSAPP_GROUP_ID;

  if (!instanceId || !token || !chatId) {
    console.error('[whatsapp] Missing Green API credentials in environment variables:', {
      hasInstanceId: !!instanceId,
      hasToken: !!token,
      hasChatId: !!chatId,
    });
    return false;
  }

  const url = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`;

  try {
    console.log(`[whatsapp] Constructing payload for Green API chat ${chatId}...`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId,
        message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[whatsapp] Green API request failed with status ${response.status}:`, errorText);
      return false;
    }

    const data = await response.json();
    console.log('[whatsapp] Message broadcasted successfully via Green API:', data);
    return true;
  } catch (error) {
    console.error('[whatsapp] Fatal exception encountered during Green API fetch dispatch:', error);
    return false;
  }
}
