import type { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer-core";
import chrome from "@sparticuz/chromium";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // const token = await getToken({ req });

  // if (!token) {
  //     return res.status(401).json({ error: "Unauthorized" });
  // }

  let browser;
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Different configuration based on environment
    const executablePath =
      process.env.NODE_ENV === "production"
        ? await chrome.executablePath
        : process.env.CHROME_PATH ||
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

    browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--font-render-hinting=none",
      ],
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    console.log("page: ", page);

    // Inject fonts directly
    await page.evaluateHandle(() => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap";
      document.head.appendChild(link);
      return document.fonts.ready;
    });

    // const cookies = req.headers.cookie;

    // if (cookies) {
    //     const cookiesArray = cookies.split(";").map((cookie) => {
    //         const [name, value] = cookie.split("=").map((c) => c.trim());
    //         return {
    //             name,
    //             value,
    //             domain: new URL(url).hostname,
    //         };
    //     });

    //     await page.setCookie(...cookiesArray);
    // }

    console.log("page 2: ", page);

    await page.goto(url, {
      waitUntil: ["networkidle0", "domcontentloaded"],
      timeout: 30000,
    });

    // await page.waitForSelector("#MainContent", { timeout: 30000 });

    await page.evaluate(() => document.fonts.ready);

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
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
      "attachment; filename=shelter-details.pdf"
    );

    res.status(200).end(pdf);
  } catch (error) {
    console.error("PDF Generation Error:", error);
    if (browser) {
      await browser.close();
    }
    return res.status(500).json({ error: "Failed to generate PDF" });
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
