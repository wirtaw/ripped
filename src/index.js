#!/usr/bin/env node

const {
  performance,
} = require('perf_hooks');

const urlM = require('url');
const autocannon = require('autocannon');

const userAgent = require('./utils/connection/userAgent');
const acceptLanguage = require('./utils/connection/acceptLanguage');

const URLS = ['https://tass.ru/userApi/getNewsFeed'];
const DURATION = 30;

async function main(url) {
  console.info(`Start cannon against ${url} `);
  const UA = userAgent.userAgent();
  const AL = acceptLanguage.acceptLanguage();
  const options = urlM.parse(url);
  // console.dir(options);

  const start = performance.now();
  const instance = await autocannon({
    url,
    connections: 100,
    pipelining: 5,
    duration: DURATION,
    workers: 10,
    requests: [
      {
        method: 'GET',
        path: '/',
        headers: {
          // eslint-disable-next-line max-len
          cookie: 'top100_id=t1.2706484.1219556700.1646725163996; t1_sid_2706484=s1.1210630723.1646725163996.1646725164000.1.1.1; last_visit=1646717963998::1646725163998; __js_p_=158,1800,0,0; __jhash_=1051; __jua_=Mozilla%2F5.0%20%28X11%3B%20Fedora%3B%20Linux%20x86_64%3B%20rv%3A97.0%29%20Gecko%2F20100101%20Firefox%2F97.0; __hash_=d0027fa22cb489be3965a05175e7d08e; tass_uuid=B2662A28-4626-435E-83C5-D4B0281EF58C; __re_=fGdmYWM1ISJ4anl6JnVzKnFwZ3NBZX84dXhzdUx8eXpuRFVQaExVUw==; adtech_uid=e9f92c6c-2e72-4c11-bd7e-7bb58f1029a4%3Atass.ru; user-id_1.0.5_lr_lruid=pQ8AACwIJ2J8mBeCAaICJwA%3D',
          origin: options.host,
          referer: options.host,
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'accept-language': AL,
          'user-agent': UA,
        },
      },
    ],
  }, finishedBench);

  autocannon.track(instance);

  // this is used to kill the instance on CTRL-C
  process.once('SIGINT', () => {
    instance.stop();
  });

  function finishedBench(err, res) {
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

    // setInterval(async () => {
    //  await Promise.all(URLS.map((item) => main(item)));
    // }, DURATION * 1000 + 20);

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
      await Promise.all(URLS.map((item) => main(item)));
    }, DURATION * 1000 + 20);

    process.exit(1);
  }
})();
