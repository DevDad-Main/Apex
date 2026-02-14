import axios from "axios";
import * as cheerio from "cheerio";
import { PrivateKeyExportOptions } from "node:crypto";
import { v7 as uuidv7 } from "uuid";

interface ScrapedDocument {
  id: string;
  url: string;
  title: string;
  content: string;
  scrapedAt: string;
}

/**
 * Fetches HTML conent from a URL
 */
async function fetchHtml(url: string): Promise<string> {
  const response = await axios.get(url, {
    timeout: 10000,
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ApexSearchBot/1.0)",
    },
  });

  return response.data;
}

/**
 * Parses HTML and extracts title and content
 */

function parseDocument(html: string, url: string): ScrapedDocument {
  const $ = cheerio.load(html);

  // Remove unwanted elements
  $("script, style, nav, header, footer, aside, .ad, .advertisement").remove();

  // Extract Title
  const title =
    $("title").text().trim() || $("h1").first().text().trim() || "Untitled";

  // Extract content from paragraphs
  const paragraphs: string[] = [];
  $("p").each((_, el) => {
    const text = $(el).text().trim();

    // Filter out short/emprty paragraphs
    if (text.length > 20) {
      paragraphs.push(text);
    }
  });

  const content = paragraphs.join(" ");

  return {
    id: uuidv7(),
    url,
    title,
    content,
    scrapedAt: new Date().toISOString(),
  };
}

export async function scrapeUrl(url: string): Promise<ScrapedDocument> {
  const html = await fetchHtml(url);
  return parseDocument(html, url);
}
