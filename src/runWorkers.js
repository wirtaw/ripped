#!/usr/bin/env node

const {
  performance,
} = require('perf_hooks');
const fs = require('fs');
const path = require('path');
const {Worker} = require('worker_threads');

function runService(workerData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      './src/worker.js', {workerData},
    );
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0)
        reject(new Error(
          `Stopped the Worker Thread with the exit code: ${code}`,
        ));
    });
  });
}

(async () => {
  const dt = new Date();
  const start = performance.now();
  console.info(`Application start ${dt.toString()}`);
  try {
    let table = [];
    const list = await fs.promises.readdir(path.join(__dirname, '../data/'));

    for await (const fileName of list) {
      // eslint-disable-next-line max-len
      const items = await fs.promises.readFile(path.join(__dirname, `../data/${fileName}`), {encoding: 'utf8'}, (error) => {
        if (error) {
          console.error(error);
        }
      });
      if (items) {
        table.push(items.split('\n'));
      }
    }
    table = table.map((block) => block.map((item) => {
      const arr = (item.indexOf('curl') > -1) ? item.split(' ') : null;
      return (arr) ? {url: arr[4], proxy: arr[2].replace(/"/gi, '')} : null;
    }).filter((item) => item !== null));
    console.dir(table);
    for await (const block of table) {
      for await (const item of block) {
        const {url, proxy} = item;
        const [res1, res2] = await Promise.all([
          runService({url, proxy: `https://${proxy}`}),
          runService({url, proxy: `http://${proxy}`}),
        ]);

        console.info(`statusCode ${res1.statusCode} ${res1.body}`);
        console.info(`statusCode ${res2.statusCode} ${res2.body}`);
      }
    }
  } catch (e) {
    const errMsg = e.message || '';
    console.error('Problem start main ',
      {
        error: errMsg,
      });

    process.exit(1);
  }
})();
