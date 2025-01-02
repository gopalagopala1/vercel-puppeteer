import type { NextApiRequest, NextApiResponse } from "next";
import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  let browser;
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Call the executablePath function
    const executablePath = await chromium.executablePath();

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath, // Now this is a string from the async function call
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    );

    await page.setViewport({
      width: 1200,
      height: 800,
      deviceScaleFactor: 1,
    });

    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "90px",
        bottom: "32px",
        left: "32px",
        right: "32px",
      },
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=shelter-details.pdf`
    );

    return res.status(200).send(pdf);
  } catch (error) {
    console.error("PDF Generation Error:", {
      error,
      env: process.env.NODE_ENV,
    });

    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Browser close error:", closeError);
      }
    }

    return res.status(500).json({
      error: "Failed to generate PDF",
      details: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
    responseLimit: "10mb",
  },
};
