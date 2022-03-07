
const {getProxyTable} = require('./cheerio');

const getListOfEnabled = async (connection, UA, AL) => {
  const URL = 'https://ddosmonitor.pp.ua/global/api/sites?online=true';

  const {statusCode, body} = await connection.getPageWithAgent(URL, '', AL, UA);

  console.info(` getList ${statusCode} `);
  return new Promise((resolve, reject) => {
    let result = [];
    try {
      if (statusCode === 200 && body) {
        const list = JSON.parse(body);

        result = [...list];
        // console.info(` getList result ${result} `);
        resolve(result);
      } else {
        console.info(` getList result2 ${result} `);
        reject(result);
      }
    } catch (exc) {
      console.error(' Error ' + exc);
      reject(result);
    }
  });
};

const getProxies = async (connection, UA, AL) => {
  const URL = 'https://www.proxynova.com/proxy-server-list/country-ru/';

  const {statusCode, body} = await connection.getPageWithAgent(URL, '', AL, UA);

  console.info(` getProxies ${statusCode} `);
  return new Promise((resolve, reject) => {
    const result = [];
    try {
      if (statusCode === 200 && body) {
        const items = getProxyTable(body);
        // console.info(` getList result ${result} `);
        resolve([...items]);
      } else {
        console.info(` getProxies result2 ${result} `);
        reject(result);
      }
    } catch (exc) {
      console.error(' Error ' + exc);
      reject(result);
    }
  });
};

module.exports = {
  getListOfEnabled,
  getProxies,
};
