import express from "express";
import cors from "cors";
import getImageFromISU from "./getImageFromISU.js";
import puppeteer from "puppeteer";
import notFound from "./notFoundBase64.js";

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
  let resultImage = notFound;

  try {
    const imageFileName = req.url.split("/").reverse()[0];

    history[imageFileName] = history[imageFileName] || { time: 0, img: "" };

    if (new Date().getTime() - history[imageFileName].time > 15 * 1000) {
      const pageUrl = process.env.PAGE_HOST + req.url;

      const imageBase64 = await getImageFromISU(page, pageUrl);

      history[imageFileName] = { time: new Date().getTime(), img: imageBase64 };
    }

    resultImage = history[imageFileName].img || notFound;
  } catch (err) {
    console.log(err);

    resultImage = notFound;
  }

  const cleanedImage = Buffer.from(
    resultImage.replace(/^data:image\/(png|jpeg|jpg);base64,/, ""),
    "base64"
  );

  res.writeHead(200, {
    "Content-Type": "image/png",
    "Content-Length": cleanedImage.length,
  });
  res.end(cleanedImage);

  page.close();
  page = await browser.newPage();
});

app.listen(parseInt("" + port), function () {
  console.log(`ISU GET IMAGE Server listens on ${port} :: ${new Date()}`);
});
