const fs = require('fs');
const path = require('path');

const replacements = [
  { from: /bg-zinc-950\/60 backdrop-blur-2xl/g, to: 'bg-black/80 backdrop-blur-xl' },
  { from: /bg-zinc-950\/60 backdrop-blur-xl/g, to: 'bg-[#0f0f0f]' },
  { from: /bg-zinc-900\/80 backdrop-blur-xl/g, to: 'bg-[#1a1a1a]' },
  { from: /bg-zinc-900\/40 backdrop-blur-md/g, to: 'bg-[#111111]' },
  { from: /bg-zinc-900\/30/g, to: 'bg-black' },
  { from: /bg-zinc-900\/50/g, to: 'bg-[#0a0a0a]' },
  { from: /bg-white\/5/g, to: 'bg-[#1a1a1a]' },
  { from: /bg-white\/10/g, to: 'bg-[#222222]' },
  { from: /bg-zinc-200/g, to: 'bg-red-700' },
  { from: /bg-zinc-100/g, to: 'bg-red-700' },
  { from: /text-zinc-950/g, to: 'text-white' },
  { from: /text-zinc-500/g, to: 'text-neutral-500' },
  { from: /text-zinc-400/g, to: 'text-neutral-400' },
  { from: /text-zinc-300/g, to: 'text-neutral-300' },
  { from: /text-zinc-200/g, to: 'text-neutral-200' },
  { from: /text-zinc-100/g, to: 'text-neutral-50' },
  { from: /border-white\/5/g, to: 'border-neutral-800' },
  { from: /border-white\/10/g, to: 'border-neutral-800' },
  { from: /border-white\/20/g, to: 'border-neutral-700' },
  { from: /ring-zinc-400/g, to: 'ring-red-600' },
  { from: /ring-zinc-500\/20/g, to: 'ring-red-900/50' },
  { from: /hover:bg-white\/10/g, to: 'hover:bg-[#2a2a2a]' },
  { from: /hover:bg-zinc-300/g, to: 'hover:bg-red-600' },
  { from: /hover:bg-white\/5/g, to: 'hover:bg-[#1a1a1a]' },
  { from: /hover:text-zinc-100/g, to: 'hover:text-red-400' },
  { from: /hover:text-zinc-900/g, to: 'hover:text-red-400' },
  { from: /text-emerald-400/g, to: 'text-red-400' },
  { from: /bg-emerald-950\/40/g, to: 'bg-red-950/40' },
  { from: /border-emerald-500\/30/g, to: 'border-red-500/30' },
  { from: /shadow-2xl/g, to: 'shadow-[0_0_40px_-10px_rgba(220,38,38,0.15)]' }
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      for (const rule of replacements) {
        content = content.replace(rule.from, rule.to);
      }
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

processDir(path.join(__dirname, 'src'));
console.log('Theme replaced successfully.');
