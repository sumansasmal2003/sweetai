// src/app/api/scrape/route.ts
import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import * as cheerio from "cheerio";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

    // Launch headless browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Optimize scraping speed by blocking images, CSS, and media
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        const type = req.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
            req.abort();
        } else {
            req.continue();
        }
    });

    // Navigate to the URL
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const html = await page.content();
    const title = await page.title();
    await browser.close();

    // Use Cheerio to parse the DOM and strip out non-article elements
    const $ = cheerio.load(html);
    $('script, style, noscript, nav, header, footer, iframe, aside, form').remove();

    // Extract the clean text
    const cleanText = $('body').text().replace(/\s+/g, ' ').trim();

    // Format as Base64 to seamlessly mimic a .txt file upload for the Python backend
    const base64Data = Buffer.from(`URL SOURCE: ${url}\n\n${cleanText}`).toString('base64');
    const formattedBase64 = `data:text/plain;base64,${base64Data}`;

    return NextResponse.json({
      title: title ? `${title.substring(0, 30)}...` : "Scraped_Article",
      base64Data: formattedBase64
    });

  } catch (error) {
    console.error("Scraping error:", error);
    return NextResponse.json({ error: "Failed to scrape URL" }, { status: 500 });
  }
}
