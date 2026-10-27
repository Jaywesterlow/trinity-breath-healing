// Paper tile for below the portrait image: its bottom band, then the same band flipped, so the
// tile joins the image's bottom edge and itself without a seam.
const sharp = require('P:/AI/trinity-breath-healing/node_modules/sharp');
(async () => {
  const H = 360, src = sharp('base-p.webp'); const { width: W, height } = await src.metadata();
  const band = await sharp('base-p.webp').extract({ left: 0, top: height - H, width: W, height: H }).toBuffer();
  const flipped = await sharp(band).flip().toBuffer();
  await sharp({ create: { width: W, height: H * 2, channels: 3, background: '#000' } })
    .composite([{ input: flipped, top: 0, left: 0 }, { input: band, top: H, left: 0 }]).webp({ quality: 80 }).toFile('paper-p.webp');
  console.log('paper-p.webp', W, H * 2);
})();
