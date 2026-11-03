const fs = require('fs');
const https = require('https');

function fetchText(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', () => resolve(''));
    req.setTimeout(5000, () => { req.destroy(); resolve(''); });
  });
}

async function scrapeAll() {
  console.log("Start live scraper voor Mestreech Vendaog...");
  let articles = [];

  // 1. P2000 / 112 Meldingen Maastricht
  try {
    const p2000Html = await fetchText('https://p2000.net/limburg/maastricht');
    const items = p2000Html.match(/<div class="[^"]*melding[^"]*"[\s\S]*?<\/div>/gi) || [];
    const textBlocks = p2000Html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, '\n').split('\n');
    
    let p2000Found = 0;
    for (let i = 0; i < textBlocks.length && p2000Found < 3; i++) {
      let line = textBlocks[i].trim();
      if ((line.includes('Maastricht') || line.includes('Brandweer') || line.includes('Ambulance') || line.includes('Politie')) && line.length > 20) {
        articles.push({
          id: `p2000-${p2000Found}`,
          title: `🚨 112: ${line}`,
          source: "112 Maastricht",
          url: "https://p2000.net/limburg/maastricht",
          category: "112",
          time: "Recent",
          image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80",
          snippet: "Actuele alarmering via P2000 meldkamer Limburg-Zuid voor Maastricht.",
          locationTag: "Maastricht"
        });
        p2000Found++;
      }
    }
  } catch (e) {
    console.log("P2000 overgeslagen:", e.message);
  }

  // 2. Vermiste Bieste Maastricht
  articles.push({
    id: "bieste-1",
    title: "🐾 Dierenbescherming: Vermiste & gevonden bieste regio Maastricht",
    source: "Mijn Dier Is Zoek",
    url: "https://mijndieriszoek.dierenbescherming.nl/vermiste-dieren/honden?location=Maastricht",
    category: "bieste",
    time: "Live overzicht",
    image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80",
    snippet: "Actuele meldingen van vermiste katten, honden en gevonden bieste in Maastricht e.o.",
    locationTag: "Maastricht e.o."
  });

  // 3. Wat is loos in Mestreech
  try {
    const htmlLoos = await fetchText('https://watisloos.nl/');
    const titles = htmlLoos.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi) || [];
    titles.slice(0, 3).forEach((rawTitle, i) => {
      const clean = rawTitle.replace(/<[^>]*>/g, '').trim();
      if (clean.length > 10 && !clean.includes('Wat is loos')) {
        articles.push({
          id: `loos-${i}`,
          title: `Wat is loos: ${clean}`,
          source: "Wat is loos in Mestreech",
          url: "https://watisloos.nl/",
          category: "Wat is loos",
          time: "Recent gemeld",
          image: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=600&q=80",
          snippet: clean,
          locationTag: "Maastricht"
        });
      }
    });
  } catch (e) {}

  // 4. De Nieuwe Ster
  try {
    const htmlSter = await fetchText('https://www.denieuwestermaastricht.nl/');
    const matches = htmlSter.match(/<h[2-4][^>]*>(.*?)<\/h[2-4]>/gi) || [];
    matches.slice(0, 3).forEach((m, idx) => {
      const t = m.replace(/<[^>]*>/g, '').trim();
      if (t.length > 15 && !t.includes('Cookie') && !t.includes('Nieuwe Ster')) {
        articles.push({
          id: `ster-${idx}`,
          title: `De Nieuwe Ster: ${t}`,
          source: "De Nieuwe Ster",
          url: "https://www.denieuwestermaastricht.nl/",
          category: "De Nieuwe Ster",
          time: "Vandaag",
          image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80",
          snippet: "Lees de volledige berichtgeving en achtergronden op De Nieuwe Ster Maastricht.",
          locationTag: "Stad & Wijken"
        });
      }
    });
  } catch (e) {}

  // Wegschrijven naar www/news_data.json
  if (!fs.existsSync('www')) {
    fs.mkdirSync('www', { recursive: true });
  }
  fs.writeFileSync('www/news_data.json', JSON.stringify(articles, null, 2));
  console.log(`Klaar! ${articles.length} artikelen opgeslagen in www/news_data.json`);
}

scrapeAll();
