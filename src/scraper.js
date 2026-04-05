const { chromium } = require("playwright");
const fs = require("fs-extra");
const readline = require("readline-sync");
const path = require("path");
const cliProgress = require("cli-progress");
const chalk = require("chalk");

const BASE_URL = "https://magic.wizards.com/en/news/making-magic";
const CONCURRENCY = 5;
const PAGE_CONCURRENCY = 3;
const HEADLESS = true;

const LINKS_FILE = "links.json";
const OUTPUT_DIR = "output";

// 🔗 pegar links
async function getArticleLinks(page) {
  return await page.$$eval(
    "article a:has(h3)",
    (anchors) => anchors.map(a => a.href)
  );
}

// 🔢 total páginas
async function getTotalPages(page) {
  return await page.$eval(
    '[aria-setsize]',
    el => parseInt(el.getAttribute("aria-setsize"))
  );
}

// 🔢 contar artigos
async function countArticles(page) {
  return await page.$$eval("article", els => els.length);
}

// 🔥 scroll (lazy load)
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 300;

      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

// 🛑 detectar fim
async function hasNoResults(page) {
  return !!(await page.$("text=No Result Found"));
}

// 📊 estimativa REAL
async function getTotalLinksEstimate(context) {
  const page = await context.newPage();

  try {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    const totalPages = await getTotalPages(page);

    const lastUrl = `${BASE_URL}?page=${totalPages - 1}`;
    await page.goto(lastUrl, { waitUntil: "networkidle" });

    await page.waitForSelector("article");

    const lastCount = await countArticles(page);

    return (totalPages - 1) * 5 + lastCount;

  } finally {
    await page.close();
  }
}

// 📦 cache válido
async function getCachedLinks() {
  if (!fs.existsSync(LINKS_FILE)) return null;

  try {
    const data = await fs.readJson(LINKS_FILE);
    return Array.isArray(data) && data.length > 0 ? data : null;
  } catch {
    return null;
  }
}

// 📁 index arquivos existentes
function getDownloadedFiles(format) {
  const dir = path.join(OUTPUT_DIR, format);

  if (!fs.existsSync(dir)) return new Set();

  const files = fs.readdirSync(dir);

  return new Set(files.map(f => f.replace(/\.(html|pdf)$/, "")));
}

// 🧠 nome do arquivo
function getFileName(link) {
  return link.split("/").pop();
}

// 🚀 coleta página
async function scrapePage(context, pageNum) {
  const page = await context.newPage();

  try {
    const url =
      pageNum === 0 ? BASE_URL : `${BASE_URL}?page=${pageNum}`;

    await page.goto(url, { waitUntil: "networkidle" });

    if (await hasNoResults(page)) return null;

    await page.waitForSelector("article");

    await autoScroll(page);

    return await getArticleLinks(page);

  } finally {
    await page.close();
  }
}

// 🚀 coleta com barra
async function collectAllLinks(context) {
  console.log(chalk.blue("\n🔎 Coletando links...\n"));

  const totalLinks = await getTotalLinksEstimate(context);

  const bar = new cliProgress.SingleBar({
    format: "🔗 [{bar}] {percentage}% | {value}/{total}"
  });

  bar.start(totalLinks, 0);

  let pageNum = 0;
  let allLinks = new Set();
  let hasMore = true;

  while (hasMore) {
    const batch = [];

    for (let i = 0; i < PAGE_CONCURRENCY; i++) {
      batch.push(scrapePage(context, pageNum + i));
    }

    const results = await Promise.all(batch);

    hasMore = false;

    for (const links of results) {
      if (links === null) break;

      if (links.length > 0) {
        hasMore = true;

        for (const link of links) {
          if (!allLinks.has(link)) {
            allLinks.add(link);
            bar.increment();
          }
        }
      }
    }

    pageNum += PAGE_CONCURRENCY;
  }

  bar.stop();

  return [...allLinks];
}

// 💾 HTML
async function saveAsHTML(page, link) {
  const dir = path.join(OUTPUT_DIR, "html");
  await fs.ensureDir(dir);

  const file = path.join(dir, getFileName(link) + ".html");

  await fs.writeFile(file, await page.content());
}

// 💾 PDF
async function saveAsPDF(page, link) {
  const dir = path.join(OUTPUT_DIR, "pdf");
  await fs.ensureDir(dir);

  const file = path.join(dir, getFileName(link) + ".pdf");

  const content = await page.$eval("article", el => el.innerHTML);

  await page.setContent(content);

  await page.pdf({
    path: file,
    format: "A4"
  });
}

// 🚀 processamento
async function processLinks(context, links, format, downloaded, skipExisting) {
  const bar = new cliProgress.SingleBar({
    format: "📦 [{bar}] {percentage}% | {value}/{total}"
  });

  bar.start(links.length, 0);

  let done = 0;

  for (let i = 0; i < links.length; i += CONCURRENCY) {
    const chunk = links.slice(i, i + CONCURRENCY);

    await Promise.all(chunk.map(async (link) => {
      const page = await context.newPage();

      try {
        const name = getFileName(link);

        if (skipExisting && downloaded.has(name)) {
          done++;
          bar.update(done);
          return;
        }

        await page.goto(link, { waitUntil: "networkidle" });

        if (format === "pdf") {
          await saveAsPDF(page, link);
        } else {
          await saveAsHTML(page, link);
        }

        done++;
        bar.update(done);

      } catch {
        done++;
        bar.update(done);
      } finally {
        await page.close();
      }
    }));
  }

  bar.stop();
}

// 🎯 MAIN
async function main() {
  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext();

  let links = [];

  const cached = await getCachedLinks();

  if (cached) {
    console.log(`📦 Cache encontrado: ${cached.length} links`);

    const use = readline.question("Usar cache? (y/n): ");

    if (use === "y") links = cached;
  }

  if (links.length === 0) {
    links = await collectAllLinks(context);
    await fs.writeJson(LINKS_FILE, links, { spaces: 2 });
  }

  console.log(`\n✅ Total: ${links.length}`);

  const formatChoice = readline.question("Formato (1=HTML, 2=PDF): ");
  const format = formatChoice === "2" ? "pdf" : "html";

  const downloaded = getDownloadedFiles(format);

  let skip = false;

  if (downloaded.size > 0) {
    console.log(`📁 ${downloaded.size} arquivos já existem`);

    skip =
      readline.question("Pular existentes? (y/n): ") === "y";
  }

  console.log("\n🚀 Processando...\n");

  await processLinks(context, links, format, downloaded, skip);

  console.log("\n🎉 Finalizado!\n");

  await browser.close();
}

main();