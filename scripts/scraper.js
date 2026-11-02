const fs = require('fs');

const https = require('https');

const { execSync } = require('child_process');

​function fetchText(url) {

return new Promise((resolve, reject) => {

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {

let data = '';

res.on('data', chunk => data += chunk);

res.on('end', () => resolve(data));

}).on('error', reject);

});

}

​async function scrapeAll() {

console.log("Start live scraper voor Mestreech Vendaog...");

let articles = [];

​// 1. Wat is loos in Mestreech

try {

const htmlLoos = await fetchText('https://watisloos.nl/');

const titles = htmlLoos.match(/<h[1-6][^>]>(.?)</h[1-6]>/gi) || [];

titles.slice(0, 4).forEach((rawTitle, i) => {

const clean = rawTitle.replace(/<[^>]*>/g, '').trim();

if (clean.length > 10 && !clean.includes('Wat is loos')) {

articles.push({

id: loos-${i},

title: Wat is loos: ${clean},

source: "Wat is loos in Mestreech",

url: "https://watisloos.nl/",

category: "Wat is loos",

time: "Recent gemeld",

image: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=700&q=80",

snippet: clean,

locationTag: "Maastricht"

});

}

});

} catch (e) {

console.error("Fout bij Wat is Loos:", e.message);

}

​// 2. De Nieuwe Ster

try {

const htmlSter = await fetchText('https://www.denieuwestermaastricht.nl/');

const matches = htmlSter.match(/<h[2-4][^>]>(.?)</h[2-4]>/gi) || [];

matches.slice(0, 4).forEach((m, idx) => {

const t = m.replace(/<[^>]*>/g, '').trim();

if (t.length > 15 && !t.includes('Cookie') && !t.includes('Nieuwe Ster')) {

articles.push({

id: ster-${idx},

title: De Nieuwe Ster: ${t},

source: "De Nieuwe Ster",

url: "https://www.denieuwestermaastricht.nl/",

category: "De Nieuwe Ster",

time: "Vandaag",

image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=700&q=80",

snippet: "Lees de volledige berichtgeving en achtergronden op De Nieuwe Ster Maastricht.",

locationTag: "Stad & Wijken"

});

}

});

} catch (e) {

console.error("Fout bij De Nieuwe Ster:", e.message);

}

​// 3. Dierenbescherming Limburg

articles.unshift({

id: "animal-1",

title: "🐾 Dierenbescherming Limburg: Vermiste & gevonden dieren regio Maastricht",

source: "Mijn Dier Is Zoek",

url: "https://mijndieriszoek.dierenbescherming.nl/vermiste-dieren/honden?location=Maastricht",

category: "Vermist dier",

time: "Live overzicht",

image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=700&q=80",

snippet: "Bekijk de actuele dossiers van vermiste honden, katten en zwerfdieren in Maastricht en Mergelland.",

locationTag: "Maastricht e.o."

});

​// Wegschrijven naar www/news_data.json

if (!fs.existsSync('www')) {

fs.mkdirSync('www', { recursive: true });

}

fs.writeFileSync('www/news_data.json', JSON.stringify(articles, null, 2));

console.log(Klaar! ${articles.length} artikelen opgeslagen.);

​// Automatisch pushen naar GitHub vanuit Node.js (veilig zonder YAML-inspringfouten)

try {

execSync('git config user.name "MestreechBot"');

execSync('git config user.email "bot@mestreech.local"');

execSync('git add www/news_data.json');

execSync('git commit -m "Auto-update live data [skip ci]" || true');

execSync('git push origin main || git push');

console.log("Succesvol gepusht naar GitHub!");

} catch (err) {

console.log("Pushen overgeslagen of geen wijzigingen:", err.message);

}

}

​scrapeAll();

