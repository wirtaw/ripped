
const {workerData, parentPort} = require('worker_threads');

const Connection = require('./utils/connection/Connection');
const userAgent = require('./utils/connection/userAgent');
const acceptLanguage = require('./utils/connection/acceptLanguage');
const getPage = async (proxy, url) => {
  const UA = userAgent.userAgent();
  const AL = acceptLanguage.acceptLanguage();
  const connectionProxy = new Connection(proxy);
  const {statusCode, body} = await connectionProxy.getPageWithHeaders(url, '', UA, AL, {}, '/');

  return {statusCode, body};
};

(async () => {
  const {proxy, url} = workerData;
  console.info(`url run ${url} on proxy ${proxy}`);
  const status = await getPage(proxy, url);

  parentPort.postMessage(
    {fileName: workerData, status},
  );
})();
