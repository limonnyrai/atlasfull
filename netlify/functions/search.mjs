// Netlify serverless function for Atlas.
// Uses the Truegle endpoint from the current prototype. API availability/authentication
// depends on the provider. Set TRUEGLE_API_KEY in Netlify environment variables if required.
export default async (request) => {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (request.method === "OPTIONS") return new Response(null, {status:204, headers});
  if (request.method !== "GET") return reply({error:"Используй GET-запрос."},405,headers);

  const url = new URL(request.url);
  const query = (url.searchParams.get("query") || "").trim();
  if (!query) return reply({error:"Напиши вопрос в поисковой строке."},400,headers);
  if (query.length > 500) return reply({error:"Вопрос слишком длинный. Максимум 500 символов."},400,headers);

  const requestHeaders = {"Content-Type":"application/json","X-Truegle-Client":"atlas-search-bot"};
  if (process.env.TRUEGLE_API_KEY) requestHeaders.Authorization = `Bearer ${process.env.TRUEGLE_API_KEY}`;

  try {
    const upstream = await fetch("https://api.truegle.info/api/search", {
      method:"POST", headers:requestHeaders,
      body:JSON.stringify({query, mode:"blue-pill", filters:{language:"ru"}})
    });
    const raw = await upstream.text();
    if (!upstream.ok) return reply({error:`Поисковый сервис ответил кодом ${upstream.status}.`,details:raw.slice(0,400)},502,headers);

    let data;
    try { data = JSON.parse(raw); } catch { data = {answer:raw}; }
    const answer = typeof data === "string" ? data : (data.answer || data.text || data.result || data.summary || data.message || "");
    const list = data.results || data.sources || data.web_results || data.items || [];
    const sources = Array.isArray(list) ? list.slice(0,8).map(x => typeof x === "string" ? {url:x} : ({
      title:x.title || x.name || "", url:x.url || x.link || x.href || "",
      snippet:x.snippet || x.description || x.text || ""
    })).filter(x => /^https?:\/\//i.test(x.url))
    let finalAnswer = String(answer || "").trim();
    if (!finalAnswer && sources.length) finalAnswer = sources.map((x,i)=>`${i+1}. ${x.title || x.url}${x.snippet ? "\\n"+x.snippet : ""}\\n${x.url}`).join("\\n\\n");
    if (!finalAnswer) return reply({error:"Поисковый сервис не вернул текст ответа.",sources},502,headers);
    return reply({answer:finalAnswer,sources},200,headers);
  } catch (e) {
    return reply({error:"Не удалось подключиться к поисковому сервису.",details:String(e?.message || e)},502,headers);
  }
};
function reply(body,status,headers){return new Response(JSON.stringify(body),{status,headers});}
