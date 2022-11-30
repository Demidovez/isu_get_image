import express from "express";
import cors from "cors";
import path from "path";
import getImageFromISU from "./getImageFromISU.js";
import puppeteer from "puppeteer";

const app = express();
const port = process.env.PORT || 4000;

app.use(
  cors({
    credentials: true,
    origin: [
      "http://172.27.70.9",
      "http://localhost:3000",
      "http://172.27.70.10",
    ],
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const history = {};

const browser = await puppeteer.launch({
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-web-security"],
  defaultViewport: { width: 1920, height: 1080 },
});

let page = await browser.newPage();

app.get("/*", async (req, res) => {
  try {
    const imageFileName = req.url.split("/").reverse()[0];

    if (new Date().getTime() - (history[imageFileName] || 0) > 15 * 1000) {
      const pageUrl = process.env.PAGE_HOST + req.url;

      await getImageFromISU(page, pageUrl, imageFileName);

      history[imageFileName] = new Date().getTime();
    }

    res.sendFile(path.join(path.resolve(), `images/${imageFileName}.jpg`));
  } catch (err) {
    console.log(err);

    res.sendFile(path.join(path.resolve(), `images/not_found.png`));
  }

  page.close();
  page = await browser.newPage();
});

app.listen(parseInt("" + port), function () {
  console.log(`ISU GET IMAGE Server listens on ${port} :: ${new Date()}`);
});
