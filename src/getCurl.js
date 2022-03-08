#!/usr/bin/env node

const {
  performance,
} = require('perf_hooks');
const fs = require('fs');
const path = require('path');

const {getListOfEnabled, getProxies} = require('./utils');
const Connection = require('./utils/connection/Connection');
const userAgent = require('./utils/connection/userAgent');
const acceptLanguage = require('./utils/connection/acceptLanguage');

(async () => {
  const dt = new Date();
  const start = performance.now();
  console.info(`Application start ${dt.toString()}`);
  try {
    const UA = userAgent.userAgent();
    const AL = acceptLanguage.acceptLanguage();
    const connection = new Connection();
    const list = await getListOfEnabled(connection, UA, AL);
    const proxies = await getProxies(connection, UA, AL);

    if (list && Array.isArray(list) && list.length > 0 && proxies && Array.isArray(proxies) && proxies.length > 0) {
      const table = [];
      let i = 0;
      list.push({
        url: 'https://tass.ru',
        ip: '185.71.67.4',
      });
      for await (const item of list) {
        const {url} = item;
        table[i] = '';
        for await (const proxy of proxies) {
          table[i] = `${table[i]}curl --proxy "${proxy.item.ip}:${proxy.item.port}" -i ${url}
`;
        }
        i++;
      }

      i = 0;
      let shell = '';
      for await (const item of table) {
        await fs.promises.writeFile(path.join(__dirname, `../data/list${i}.sh`), item, {encoding: 'utf8'}, (error) => {
          if (error) {
            console.error(error);
          }
        });
        shell = `${shell}./data/list${i}.sh &
`;
        i++;
      }
      shell = `${shell}wait`;
      console.info(`run : ${shell}`);
      await fs.promises.writeFile(path.join(__dirname, 'run.txt'), shell, {encoding: 'utf8'}, (error) => {
        if (error) {
          console.error(error);
        }
      });
    }

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

    process.exit(1);
  }
})();
