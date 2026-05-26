const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

['icon.png', 'splash.png', 'adaptive-icon.png'].forEach((name) => {
  const p = path.join(assetsDir, name);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, png);
    console.log('Created', p);
  }
});

console.log('Done.');
