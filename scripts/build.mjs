import {build} from 'vite';
import {readFile,mkdir,writeFile,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await build({root:process.cwd(),build:{outDir:'dist/client',emptyOutDir:true},server:{host:'127.0.0.1',port:4173,strictPort:true}});
await mkdir('dist/server',{recursive:true});
const html=await readFile('dist/client/index.html','utf8'),worker=await readFile('worker/index.js','utf8');
await writeFile('dist/server/index.js','const INDEX_HTML='+JSON.stringify(html)+';\n'+worker);
