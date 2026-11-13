// Supabase Edge Function: submit-request
// Sends a pre-approved WhatsApp template to the Wellness Care Business number.
// Configure all values as Supabase Function Secrets; never place Meta tokens in frontend code.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  try {
    const body = await req.json();
    const name = clean(body.name, 100);
    const phone = clean(body.phone, 30);
    const specialty = clean(body.specialty, 80);
    const professional = clean(body.professional, 100);
    const modality = clean(body.modality, 30);

    if (!name || !phone || !specialty || !modality) {
      return json({ error: "Preencha nome, telefone, especialidade e modalidade." }, 400);
    }
    if (!/^\+?[0-9 ()-]{8,25}$/.test(phone)) {
      return json({ error: "Indique um número de telefone válido." }, 400);
    }

    const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    const recipient = Deno.env.get("WELLNESS_WHATSAPP_RECIPIENT") || "258875414048";
    const template = Deno.env.get("WHATSAPP_TEMPLATE_NAME") || "wellness_new_request";
    const language = Deno.env.get("WHATSAPP_TEMPLATE_LANGUAGE") || "pt";
    const graphVersion = Deno.env.get("WHATSAPP_GRAPH_VERSION");

    if (!accessToken || !phoneNumberId || !graphVersion) {
      console.error("WhatsApp Cloud API secrets are not fully configured.");
      return json({ error: "O canal de notificações ainda não está configurado." }, 503);
    }

    const response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "template",
        template: {
          name: template,
          language: { code: language },
          components: [{
            type: "body",
            parameters: [
              { type: "text", text: name },
              { type: "text", text: phone },
              { type: "text", text: specialty },
              { type: "text", text: professional || "Equipa Wellness Care" },
              { type: "text", text: modality }
            ]
          }]
        }
      })
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("WhatsApp API error:", JSON.stringify(result));
      return json({ error: "Não foi possível notificar a Wellness Care. Verifique o modelo aprovado e as credenciais da Meta." }, 502);
    }
    return json({ ok: true, message: "Pedido encaminhado para a Wellness Care." }, 200);
  } catch (error) {
    console.error("Request processing error:", error);
    return json({ error: "Pedido inválido ou erro interno." }, 400);
  }
});

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/[<>\u0000-\u001F]/g, " ").trim().slice(0, max) : "";
}
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
