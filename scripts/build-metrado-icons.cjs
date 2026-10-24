const fs = require('node:fs');
const path = require('node:path');
const spec = require('../design/metrados-icons.json');
const labels = require('../design/metrado-label-outlines.json');
const destination = path.resolve(__dirname, '../public/icons/metrados');
const source = name => fs.readFileSync(path.join(destination, 'source', name + '.svg'));
const embedded = (name,x,y,width,height) => `<image x="${x}" y="${y}" width="${width}" height="${height}" href="data:image/svg+xml;base64,${source(name).toString('base64')}"/>`;
const documentBody = embedded('paper',2,1,12,14)+embedded('fold',10,1.5,3.5,3.5)+embedded('accent',4,4,5,2)+embedded('line',4,6.5,8,1);
for (const icon of spec.icons) {
  let body = icon.body;
  if (icon.name === 'slab' || icon.name === 'column') body = embedded(icon.name,1,1,14,14);
  if (icon.name === 'items') {
    fs.writeFileSync(path.join(destination, icon.name + '.svg'),source('items'));
    continue;
  }
  if (icon.name === 'steel-sheet' || icon.name === 'worksheet') body = documentBody + labels[icon.name];
  if (!body) throw Error('Falta el vector de ' + icon.name);
  fs.writeFileSync(path.join(destination,icon.name+'.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="${spec.stroke}" stroke-width="1" stroke-linecap="square" stroke-linejoin="miter">${body}</svg>\n`);
}
console.log(`${spec.icons.length} iconos SVG locales listos.`);

// Keep the source geometry and blue accent; resting icons use the muted outline.
// Embedded original vectors must receive the same palette as the outer SVG.
const inactiveDirectory = path.join(destination, 'inactive');
fs.mkdirSync(inactiveDirectory, { recursive: true });
function inactiveSvg(svg) {
  return svg.replace(/data:image\/svg\+xml;base64,([A-Za-z0-9+/=]+)/g, (_, data) =>
    'data:image/svg+xml;base64,' + Buffer.from(inactiveSvg(Buffer.from(data, 'base64').toString('utf8'))).toString('base64')
  ).replaceAll(spec.stroke, spec.muted);
}
for (const icon of spec.icons) {
  fs.writeFileSync(path.join(inactiveDirectory, icon.name + '.svg'), inactiveSvg(fs.readFileSync(path.join(destination, icon.name + '.svg'), 'utf8')));
}
console.log(`${spec.icons.length} variantes inactivas listas.`);
