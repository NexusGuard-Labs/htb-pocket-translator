// Avaliação opcional: usa a API real e consome cota. Não é parte de npm test.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const extension = path.resolve(__dirname, '../HTB-Pocket-Translator');
const config = process.env.HTB_CONFIG_FILE || path.join(extension, 'config.js');
if (!fs.existsSync(config)) throw new Error('Informe HTB_CONFIG_FILE com sua configuração local ignorada pelo Git.');
const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'prompt-cases.json')));
const keyContext = vm.createContext({});
vm.runInContext(fs.readFileSync(config, 'utf8'), keyContext);
const privateKey = vm.runInContext('CONFIG.GEMINI_API_KEY', keyContext);
const context = vm.createContext({ console: { log() {}, warn() {}, error() {} }, URL, AbortController, setTimeout, clearTimeout,
  fetch: (url, options) => url === 'local-models.json' ? Promise.resolve({ json: async () => JSON.parse(fs.readFileSync(path.join(extension, 'models.json'))) }) : fetch(url, options),
  importScripts: () => vm.runInContext(fs.readFileSync(config, 'utf8'), context),
  chrome: {
    storage: { local: { setAccessLevel: async () => {}, get: async () => ({ geminiApiKey: privateKey }) } },
    runtime: { getURL: () => 'local-models.json', onMessage: { addListener() {} }, onInstalled: { addListener() {} } },
    contextMenus: { onClicked: { addListener() {} } }
  }
});
vm.runInContext(fs.readFileSync(path.join(extension, 'background.js'), 'utf8'), context);
context.translate(cases.map(({ id, text }) => ({ id, text }))).then(({ results, model }) => {
  console.log('Modelo:', model);
  for (const result of results) {
    const sample = cases.find(c => c.id === result.id);
    console.log(`${result.id}: ${result.translatedText}`);
    const text = result.translatedText.toLowerCase();
    for (const term of sample.required) assert(text.includes(term.toLowerCase()), `Caso ${sample.id}: faltou ${term}`);
    for (const term of sample.forbidden) assert(!text.includes(term.toLowerCase()), `Caso ${sample.id}: apareceu ${term}`);
  }
  console.log('Terminologia aprovada nos exemplos; revise também naturalidade e sentido.');
}).catch(error => { console.error(error.message); process.exitCode = 1; });
