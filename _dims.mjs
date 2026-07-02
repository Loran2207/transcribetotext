import { readFileSync, readdirSync, writeFileSync } from 'fs';
const DIR = 'C:/Users/kutsk/AppData/Local/Temp/shots';
const DSF = 2;
const out = {};
for (const f of readdirSync(DIR)) {
  if (!f.endsWith('.png')) continue;
  const buf = readFileSync(`${DIR}/${f}`);
  // PNG: width at bytes 16-19, height 20-23 (big-endian)
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  out[f.replace('.png','')] = { wpx: w, hpx: h, w: Math.round(w/DSF), h: Math.round(h/DSF) };
}
writeFileSync(`${DIR}/dims.json`, JSON.stringify(out));
// print the non-874 ones (full variants + showcase)
for (const [k,v] of Object.entries(out)) if (v.h !== 874) console.log(k, '->', v.w+'x'+v.h);
console.log('total pngs:', Object.keys(out).length);
