// Supabase Edge Function: submit-request
// Sends new referral requests by email to the Wellness Care administration inbox.
// Configure RESEND_API_KEY and RESEND_FROM_EMAIL as Supabase Function Secrets.
// Never place email-provider credentials in frontend code.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const inbox = "Wellnesscaremoz@gmail.com";

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
    if (!/^\\+?[0-9 ()-]{8,25}$/.test(phone)) {
      return json({ error: "Indique um número de telefone válido." }, 400);
    }

    const apiKey = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("RESEND_FROM_EMAIL");
    if (!apiKey || !from) {
      console.error("Resend email secrets are not fully configured.");
      return json({ error: "O envio de notificações por email ainda não está configurado." }, 503);
    }

    const subject = `Novo pedido de encaminhamento — ${specialty}`;
    const textBody = [
      "Foi recebido um novo pedido no site Wellness Care.",
      "",
      `Nome: ${name}`,
      `Telefone: ${phone}`,
      `Especialidade: ${specialty}`,
      `Profissional: ${professional || "Equipa Wellness Care"}`,
      `Modalidade: ${modality}`,
      "",
      "Este pedido requer acompanhamento da equipa administrativa.",
      "Não foram incluídas informações clínicas sensíveis."
    ].join("\\n");
    const htmlBody = `<h2>Novo pedido de encaminhamento</h2>
      <p>Foi recebido um novo pedido no site Wellness Care.</p>
      <table cellpadding="8" cellspacing="0" style="border-collapse:collapse">
        <tr><td><strong>Nome</strong></td><td>${escapeHtml(name)}</td></tr>
        <tr><td><strong>Telefone</strong></td><td>${escapeHtml(phone)}</td></tr>
        <tr><td><strong>Especialidade</strong></td><td>${escapeHtml(specialty)}</td></tr>
        <tr><td><strong>Profissional</strong></td><td>${escapeHtml(professional || "Equipa Wellness Care")}</td></tr>
        <tr><td><strong>Modalidade</strong></td><td>${escapeHtml(modality)}</td></tr>
      </table>
      <p>Este pedido requer acompanhamento da equipa administrativa.</p>`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [inbox], subject, text: textBody, html: htmlBody })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Email provider error:", JSON.stringify(result));
      return json({ error: "Não foi possível enviar o email. Verifique a configuração do serviço de email." }, 502);
    }

    return json({ ok: true, message: "Pedido enviado para o email da Wellness Care." }, 200);
  } catch (error) {
    console.error("Request processing error:", error);
    return json({ error: "Pedido inválido ou erro interno." }, 400);
  }
});

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/[<>\\u0000-\\u001F]/g, " ").trim().slice(0, max) : "";
}
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char] || char);
}
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
