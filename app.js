(() => {
  const form = document.getElementById("searchForm");
  const input = document.getElementById("question");
  const button = document.getElementById("searchButton");
  const status = document.getElementById("status");
  const results = document.getElementById("results");
  const answer = document.getElementById("answer");
  const sources = document.getElementById("sources");
  const sourcesCard = document.getElementById("sourcesCard");
  const API_URL = "/.netlify/functions/search";

  function validUrl(value) {
    try { const u = new URL(value); return ["https:", "http:"].includes(u.protocol) ? u.href : null; }
    catch { return null; }
  }
  function renderLinks(text, el) {
    el.replaceChildren();
    const re = /https?:\/\/[^\s<>"']+/g;
    let last = 0, match;
    while ((match = re.exec(text))) {
      el.append(document.createTextNode(text.slice(last, match.index)));
      let raw = match[0], tail = "";
      while (/[),.!?;:]$/.test(raw)) { tail = raw.slice(-1) + tail; raw = raw.slice(0, -1); }
      const url = validUrl(raw);
      if (url) {
        const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = raw; el.append(a);
      } else el.append(document.createTextNode(raw));
      el.append(document.createTextNode(tail)); last = re.lastIndex;
    }
    el.append(document.createTextNode(text.slice(last)));
  }
  function renderSources(text, dataSources) {
    sources.replaceChildren();
    const urls = [];
    if (Array.isArray(dataSources)) dataSources.forEach(x => urls.push(typeof x === "string" ? x : x && (x.url || x.link)));
    (text.match(/https?:\/\/[^\s<>"']+/g) || []).forEach(x => urls.push(x.replace(/[),.!?;:]+$/, "")));
    const unique = [...new Set(urls.map(validUrl).filter(Boolean))].slice(0, 8);
    sourcesCard.classList.toggle("hidden", !unique.length);
    unique.forEach(url => {
      const card = document.createElement("div"); card.className = "source";
      const title = document.createElement("div"); title.className = "source-title";
      title.textContent = new URL(url).hostname.replace(/^www\./, "");
      const link = document.createElement("a"); link.className = "source-url"; link.href = url;
      link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = "Открыть источник ↗";
      card.append(title, link); sources.append(card);
    });
  }
  async function search(query) {
    query = query.trim(); if (!query) return;
    input.value = query; button.disabled = true; button.textContent = "Ищу…";
    status.textContent = "Ищем информацию и источники…"; results.classList.add("hidden");
    try {
      const response = await fetch(`${API_URL}?query=${encodeURIComponent(query)}`, {headers: {"Accept":"application/json, text/plain"}});
      const raw = await response.text();
      if (!response.ok) throw new Error(`Ошибка сервера ${response.status}${raw ? ": " + raw.slice(0,220) : ""}`);
      let text = raw, sourceItems = [];
      try {
        const d = JSON.parse(raw);
        if (typeof d === "string") text = d;
        else if (d && typeof d === "object") { text = d.answer || d.text || d.result || d.message || raw; sourceItems = d.sources || d.results || []; }
      } catch {}
      text = String(text).trim(); if (!text) throw new Error("Сервер вернул пустой ответ.");
      renderLinks(text, answer); renderSources(text, sourceItems);
      results.classList.remove("hidden"); status.textContent = "Готово! Вот что удалось найти.";
    } catch (e) {
      answer.textContent = "Не удалось выполнить поиск.\n\n" + e.message + "\n\nПроверь доступность поискового сервиса и настройки Netlify.";
      sources.replaceChildren(); sourcesCard.classList.add("hidden"); results.classList.remove("hidden");
      status.textContent = "Поиск завершился с ошибкой.";
    } finally { button.disabled = false; button.innerHTML = 'Найти <span>→</span>'; }
  }
  form.addEventListener("submit", e => { e.preventDefault(); search(input.value); });
  document.querySelectorAll("[data-question]").forEach(b => b.addEventListener("click", () => search(b.dataset.question)));
})();