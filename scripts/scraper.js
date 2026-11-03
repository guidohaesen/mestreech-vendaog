const fs = require('fs');
const https = require('https');

function fetchText(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', () => resolve(''));
    req.setTimeout(6000, () => { req.destroy(); resolve(''); });
  });
}

async function scrapeAll() {
  console.log("Start live scraper...");
  let articles = [];

  // Stockfoto's voor hulpdiensten
  const imgPolice = "https://images.unsplash.com/photo-1590483259972-c220f1885f8f?auto=format&fit=crop&w=600&q=80"; // Politie zwaailicht
  const imgAmbu = "https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&w=600&q=80"; // Ambulance
  const imgFire = "https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=600&q=80"; // Brandweer

  // 1. YouTube Feed: Wat is loos in Mestreech
  try {
    const ytXml = await fetchText('https://www.youtube.com/feeds/videos.xml?channel_id=UC8uzG0kLkHuhLTYezCXKqJg');
    const entries = ytXml.match(/<entry>[\s\S]*?<\/entry>/gi) || [];
    entries.slice(0, 3).forEach((entry, i) => {
      const titleMatch = entry.match(/<title>(.*?)<\/title>/);
      const videoIdMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
      if (titleMatch && videoIdMatch) {
        const title = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
        const vid = videoIdMatch[1].trim();
        articles.push({
          id: `yt-${vid}`,
          title: `Wat is loos: ${title}`,
          source: "Wat is loos (Video)",
          url: `https://www.youtube-nocookie.com/embed/${vid}?autoplay=1`,
          category: "Wat is loos",
          time: "Video update",
          image: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
          snippet: "Bekijk de videoreportage van Wat is loos in Mestreech direct in de app.",
          locationTag: "Mestreech Video"
        });
      }
    });
  } catch (e) {
    console.log("YouTube scraper fout:", e.message);
  }

  // 2. Vermiste Bieste Maastricht
  articles.push({
    id: "biest-1",
    title: "🐾 Dierenbescherming: Vermiste & gevonden bieste regio Maastricht",
    source: "Mijn Dier Is Zoek",
    url: "https://mijndieriszoek.dierenbescherming.nl/vermiste-dieren/honden?location=Maastricht",
    category: "bieste",
    time: "Live overzicht",
    image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80",
    snippet: "Actuele meldingen van vermiste honden, katten en zwerfdieren in Maastricht e.o.",
    locationTag: "Maastricht e.o."
  });

  // 3. 112 P2000 met dynamische stockfoto's (geen doorklik url)
  try {
    const p2000Html = await fetchText('https://p2000.net/limburg/maastricht');
    const textBlocks = p2000Html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, '\n').split('\n');
    let pCount = 0;
    for (let i = 0; i < textBlocks.length && pCount < 3; i++) {
      let line = textBlocks[i].trim();
      if ((line.includes('Maastricht') || line.includes('Brandweer') || line.includes('Ambulance') || line.includes('Politie')) && line.length > 20) {
        let chosenImg = imgPolice;
        if (line.toLowerCase().includes('brand')) chosenImg = imgFire;
        else if (line.toLowerCase().includes('ambulance') || line.toLowerCase().includes('letsel')) chosenImg = imgAmbu;

        articles.push({
          id: `p2000-${pCount}`,
          title: `🚨 112: ${line}`,
          source: "112 Maastricht",
          url: "", // Leeg betekent: geen doorklikpagina!
          category: "112",
          time: "Recent",
          image: chosenImg,
          snippet: "Directe melding via P2000 meldkamer Limburg-Zuid.",
          locationTag: "Maastricht"
        });
        pCount++;
      }
    }
  } catch(e) {}

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
          snippet: "Lees de volledige berichtgeving op De Nieuwe Ster Maastricht.",
          locationTag: "Stad & Wijken"
        });
      }
    });
  } catch (e) {}

  if (!fs.existsSync('www')) fs.mkdirSync('www', { recursive: true });
  fs.writeFileSync('www/news_data.json', JSON.stringify(articles, null, 2));
  console.log(`Klaar! ${articles.length} artikelen opgeslagen.`);
}

scrapeAll();
