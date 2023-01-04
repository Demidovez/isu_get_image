import Jimp from "jimp";

const getImageFromISU = (page, pageUrl) => {
  return new Promise(async (resolve, reject) => {
    const start = new Date().getTime();
    console.log("start... " + pageUrl);
    const result = await page.goto(pageUrl, {
      waitUntil: "networkidle0",
    });

    console.log("end: " + (new Date().getTime() - start));

    if (result.status() === 404) {
      reject("404 status code found in result for: " + pageUrl);
    }

    page
      .screenshot({
        encoding: "base64",
        type: "jpeg",
        quality: 100,
        fullPage: true,
      })
      .then((image) => {
        Jimp.read(Buffer.from(image.toString("base64"), "base64"))
          .then((image) => image.crop(0, 65, 1920, 960).quality(100))
          .then((image) => {
            image.getBase64(Jimp.AUTO, (err, res) => {
              resolve(res);
            });
          })
          .catch((err) => reject(err));
      });
  });
};

export default getImageFromISU;
