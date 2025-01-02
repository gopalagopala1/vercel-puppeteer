//@ts-nocheck
import type { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";  // Use regular puppeteer for development
import chrome from "@sparticuz/chromium";

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
  
      browser = await puppeteer.launch({
        args: [...chrome.args],
        executablePath: await chrome.executablePath(),
        headless: chrome.headless,
        defaultViewport: chrome.defaultViewport,
      });
  

    // Create a new page with timeout
    const page = await Promise.race([
      browser.newPage(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Page creation timeout')), 30000)
      )
    ]);

    // Enable request interception to handle timeouts
    await page.setRequestInterception(true);
    page.on('request', request => {
      // Add timeout to all requests
      Promise.race([
        request.continue(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 30000)
        )
      ]).catch(() => request.abort());
    });

    // Set viewport and user agent
    await page.setViewport({ width: 1200, height: 800 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    // Navigate to the page with timeout handling
    await Promise.race([
      page.goto(url, {
        waitUntil: "networkidle0",
        timeout: 30000,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Navigation timeout')), 30000)
      )
    ]);

    // Wait for any fonts to load
    await Promise.race([
      page.evaluate(() => document.fonts.ready),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Font loading timeout')), 10000)
      )
    ]);

    // Generate PDF with timeout
    const pdf = await Promise.race([
      page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: "90px",
          bottom: "32px",
          left: "32px",
          right: "32px",
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PDF generation timeout')), 30000)
      )
    ]);

    await browser.close();

    // Set response headers and send PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=shelter-details.pdf"
    );
    
    return res.status(200).send(pdf);

  } catch (error) {
    console.error("PDF Generation Error:", {
      message: error.message,
      stack: error.stack,
      env: process.env.NODE_ENV
    });

    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Error closing browser:", closeError);
      }
    }

    return res.status(500).json({ 
      error: "Failed to generate PDF",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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