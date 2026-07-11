export async function POST() {
  // TODO: implement Telegram webhook handling and validation
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
