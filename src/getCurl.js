#!/usr/bin/env node

'use strict';

const {
  performance,
} = require('perf_hooks');
const fs = require('fs');
const path = require('path');

const { getListOfEnabled, getProxies } = require('./utils');
const Connection = require('./utils/connection/Connection');
const userAgent = require('./utils/connection/userAgent');
const acceptLanguage = require('./utils/connection/acceptLanguage');

const getPage = async ( url, proxy ) => {
  let UA = userAgent.userAgent();
  let AL = acceptLanguage.acceptLanguage();
  const connectionProxy = new Connection(proxy);
  const { statusCode, body } = await connectionProxy.getPageWithAgent(url, '', UA, AL);

  return { statusCode, body };
};


(async () => {
  const dt = new Date();
  const start = performance.now();
  console.info(`Application start ${dt.toString()}`);
  try {

    let UA = userAgent.userAgent();
    let AL = acceptLanguage.acceptLanguage();
    const connection = new Connection();
    const list = await getListOfEnabled(connection, UA, AL);
    const proxies = await getProxies(connection, UA, AL);

    if (list && Array.isArray(list) && list.length > 0 && proxies && Array.isArray(proxies) && proxies.length > 0) {
      let table = [];
      let i = 0;
      for await(const item of list) {
        const { url } = item;
        table[i] = '';
        for await (const proxy of proxies) {
          /*const [res1, res2] = await Promise.all([
            getPage(url, `https://${proxy.item.ip}:${proxy.item.port}`),
            getPage(url, `http://${proxy.item.ip}:${proxy.item.port}`)
          ]);

          console.info(`statusCode ${res1.statusCode} ${res1.body}`);
          console.info(`statusCode ${res2.statusCode} ${res2.body}`);
          */
          table[i] = `${table[i]}curl --proxy "${proxy.item.ip}:${proxy.item.port}" -i ${url}
`;
        }
        i++;
      }

      i = 0;
      let shell= '';
      for await(const item of table) {
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
      await fs.promises.writeFile(path.join(__dirname, `run.txt`), shell, {encoding: 'utf8'}, (error) => {
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
