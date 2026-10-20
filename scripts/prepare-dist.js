import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const outputPublicDir = path.join(rootDir, ".output", "public");
const outputServerDir = path.join(rootDir, ".output", "server");
const distDir = path.join(rootDir, "dist");

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log("Preparing dist directory for artifact packaging...");

// 1. Copy .output/public -> dist
if (fs.existsSync(outputPublicDir)) {
  copyDirRecursive(outputPublicDir, distDir);
  console.log(`Copied .output/public -> dist`);
}

// 2. Copy .output/server -> dist/server
if (fs.existsSync(outputServerDir)) {
  copyDirRecursive(outputServerDir, path.join(distDir, "server"));
  console.log(`Copied .output/server -> dist/server`);
}

// 3. Ensure dist/index.html exists for static host fallback
const distIndexHtml = path.join(distDir, "index.html");
if (!fs.existsSync(distIndexHtml)) {
  let mainJs = "";
  let mainCss = "";

  const assetsDir = path.join(distDir, "assets");
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    mainJs = files.find((f) => f.startsWith("index-") && f.endsWith(".js")) || "";
    mainCss = files.find((f) => f.startsWith("styles-") && f.endsWith(".css")) || "";
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sol &amp; Mar Rent a Car | Locação de Veículos em Fortaleza</title>
    <meta name="description" content="Locadora de veículos em Fortaleza - Sol &amp; Mar Rent a Car. Sua viagem. Seu caminho. Sua liberdade. Locação com atendimento humano e frota revisada." />
    <meta property="og:title" content="Sol &amp; Mar Rent a Car" />
    <meta property="og:description" content="Locação de veículos em Fortaleza com atendimento próximo, flexibilidade e veículos revisados." />
    <meta property="og:type" content="website" />
    <link rel="icon" href="/favicon.ico" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" />
    ${mainCss ? `<link rel="stylesheet" href="/assets/${mainCss}" />` : ""}
    <script>
      (function(){try{var s=localStorage.getItem('solemar-theme');var p=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=s||(p?'dark':'light');if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');}else{document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}}catch(e){}})();
    </script>
  </head>
  <body>
    <div id="root"></div>
    ${mainJs ? `<script type="module" src="/assets/${mainJs}"></script>` : ""}
  </body>
</html>`;

  fs.writeFileSync(distIndexHtml, html, "utf-8");
  console.log(`Generated dist/index.html`);
}

console.log("dist directory prepared successfully. File count:", fs.readdirSync(distDir).length);
