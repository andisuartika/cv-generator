import { toJpeg, toPng } from "html-to-image";

export type ImageFormat = "png" | "jpg";

/** Renders the A4 sheet to an image in the browser. Nothing is sent to a server. */
export async function downloadImage(node: HTMLElement, format: ImageFormat, fileName: string) {
  await document.fonts.ready;
  await Promise.all([...node.querySelectorAll("img")].map((img) => img.decode()));

  const render = format === "png" ? toPng : toJpeg;
  const dataUrl = await render(node, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    quality: 0.95, // only used for JPG
    style: { boxShadow: "none", margin: "0" },
  });

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `${fileName}.${format}`;
  link.click();
}
