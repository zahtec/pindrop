import { spawn } from 'child_process';

const files = ['index.js', 'icons.js', 'sw.js', 'qr.js', 'zip.js'];

files.forEach(async file => {
    spawn('terser', [`./public/${file}`, '-o', `./public/${file}`]);
});
