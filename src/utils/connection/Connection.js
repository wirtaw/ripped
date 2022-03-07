
const {URLSearchParams} = require('url');
const urlM = require('url');
const https = require('https');
const httpfollow = require('follow-redirects').http;
const HttpsProxyAgent = require('https-proxy-agent');
const http = require('http');
const shttp = require('socks5-http-client');
const shttps = require('socks5-https-client');

const userAgent = require('./userAgent');
const acceptLanguage = require('./acceptLanguage');
const countriesCodeMap = require('./countriesCodeMap');

class Connection {
  constructor(proxy) {
    this.proxy = proxy;
    this.options = {
      url: null,
      method: 'GET',
      timeout: 1000,
      headers: {
        Connection: 'keep-alive',
        Pragma: 'no-cache',
        'Cache-Control': 'no-cache',
        'User-Agent': userAgent.userAgent() || '',
        'Accept-Language': acceptLanguage.acceptLanguage() || '',
        'Cookie': '',
      },
    };
  }

  async getPage(url) {
    const options = urlM.parse(url);

    Object.keys(this.options).forEach(key => {
      options[key] = this.options[key];
    });

    if (this.proxy) {
      options.proxy = this.proxy;
      options.tunnel = true;
    }

    console.dir(options, {depth: 2});

    return new Promise((resolve, reject) => {
      const result = {statusCode: null, body: null};
      const req = https.request(options, response => {
        console.info(`"response" event! ${response.statusCode}`);
        const encoding = 'utf8';
        result.statusCode = response.statusCode;

        let buffers = [];
        let bufferLength = 0;
        const strings = [];

        console.log('HEADERS: ' + JSON.stringify(response.headers));
        response.on('data', chunk => {
          if (!Buffer.isBuffer(chunk)) {
            strings.push(chunk);
          } else if (chunk.length) {
            bufferLength += chunk.length;
            buffers.push(chunk);
          }
        });

        response.on('end', () => {
          try {
            response.body = null;

            if (bufferLength) {
              response.body = Buffer.concat(buffers, bufferLength);

              if (encoding) {
                response.body = response.body.toString(encoding);
              }

              buffers = [];
              bufferLength = 0;
            } else if (strings.length) {
              if (encoding === 'utf8' && strings[0].length > 0 && strings[0][0] === '\uFEFF') {
                strings[0] = strings[0].substring(1);
              }

              response.body = strings.join('');
            }

            if (response.body) {
              result.body = response.body;
            }

            resolve(result);
          } catch (e) {
            result.error = true;
            result.message = new Error('Problem to read data from response');
            reject(result);
          }
        });
      });

      req.end();

      req.setTimeout(1000);
      req.setSocketKeepAlive(true, 1000);

      req.on('error', err => {
        result.error = true;
        result.message = err;
        // console.info(`socket ${task.index} error`);
        reject(result);
      });
    });
  }

  async getPageWithAgent(url, cookie, al, ua) {
    const options = urlM.parse(url);
    const isSecureProtocol = (options.protocol === 'https:');
    const protocolPackage = (isSecureProtocol) ? https : http;

    if (this.proxy && isSecureProtocol) {
      const agentOptions = urlM.parse(this.proxy);
      agentOptions.protocol = 'TLSv1_2_method';
      agentOptions.ciphers = 'ALL';

      const agent = new HttpsProxyAgent(agentOptions);
      options.agent = agent;

      options.proxy = this.proxy;
      options.tunnel = true;
    }

    options.timeout = 2000;
    options.connectTimeout = 1000;

    options.headers = {
      accept: 'application/json',
      connection: 'keep-alive',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      'User-Agent': ua || userAgent.userAgent() || '',
      'Accept-Language': al || acceptLanguage.acceptLanguage() || '',
      'cookie': cookie,
    };

    options.method = 'GET';
    if (this.proxy && isSecureProtocol) {
      options.secureProtocol = 'TLSv1_2_method';
    }

    // console.dir(options, { depth: 2 });
    // debugger;

    return new Promise((resolve, reject) => {
      const result = {statusCode: null, body: null, headers: null};
      const req = protocolPackage.request(options, response => {
        console.info(`"response" event! ${response.statusCode}`);
        const encoding = 'utf8';
        result.statusCode = response.statusCode;

        let buffers = [];
        let bufferLength = 0;
        const strings = [];

        // console.log('HEADERS: ' + JSON.stringify(response.headers));
        result.headers = response.headers;
        response.on('data', chunk => {
          if (!Buffer.isBuffer(chunk)) {
            strings.push(chunk);
          } else if (chunk.length) {
            bufferLength += chunk.length;
            buffers.push(chunk);
          }
        });

        response.on('end', () => {
          try {
            response.body = null;

            if (bufferLength) {
              response.body = Buffer.concat(buffers, bufferLength);

              if (encoding) {
                response.body = response.body.toString(encoding);
              }

              buffers = [];
              bufferLength = 0;
            } else if (strings.length) {
              if (encoding === 'utf8' && strings[0].length > 0 && strings[0][0] === '\uFEFF') {
                strings[0] = strings[0].substring(1);
              }

              response.body = strings.join('');
            }

            if (response.body) {
              result.body = response.body;
            }

            resolve(result);
          } catch (e) {
            result.error = true;
            result.message = new Error('Problem to read data from response');
            reject(result);
          }
        });
      });

      req.end();

      req.setTimeout(1000);
      req.setSocketKeepAlive(true, 1000);

      req.on('error', err => {
        result.error = true;
        result.message = err;
        console.info(`socket ${url} error ${err}`);
        reject(result);
      });
    }).catch((exp) => {
      const result = {statusCode: null, body: null, headers: null};
      result.error = true;
      result.message = exp.toString();
      console.dir(exp, {depth: 2});
      console.info(`socket ${url} error ${exp}`);
      return result;
    });
  }

  async getPageWithSocksAgent(url, cookie, al, ua, headers) {
    const options = urlM.parse(url);
    const isSecureProtocol = (options.protocol === 'https:');
    const protocolPackage = (isSecureProtocol) ? shttps : shttp;

    options.timeout = 2000;
    options.connectTimeout = 1000;

    options.headers = {
      connection: 'keep-alive',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      'User-Agent': ua || userAgent.userAgent() || '',
      'Accept-Language': al || acceptLanguage.acceptLanguage() || '',
      'cookie': cookie,
      ...headers,
    };

    options.method = 'GET';
    options.socksPort = 9050;

    // console.dir(options, { depth: 2 });
    // debugger;

    return new Promise((resolve, reject) => {
      const result = {statusCode: null, body: null, headers: null};
      const req = protocolPackage.request(options, response => {
        console.info(`'${url}' "response" event! ${response.statusCode}`);
        const encoding = 'utf8';
        result.statusCode = response.statusCode;

        let buffers = [];
        let bufferLength = 0;
        const strings = [];
        // console.info('req.path: ' + req.path);
        if (req.path.indexOf('/v1/live/line') > -1) {
          console.info('HEADERS: ' + JSON.stringify(response.headers));
          console.info('encoding: ' + encoding);
          // debugger;
        }

        // console.log('HEADERS: ' + JSON.stringify(response.headers));
        result.headers = response.headers;
        response.on('data', chunk => {
          if (!Buffer.isBuffer(chunk)) {
            strings.push(chunk);
          } else if (chunk.length) {
            bufferLength += chunk.length;
            buffers.push(chunk);
          }
        });

        response.on('end', () => {
          try {
            response.body = null;

            if (bufferLength) {
              response.body = Buffer.concat(buffers, bufferLength);

              if (encoding) {
                response.body = response.body.toString(encoding);
              }

              buffers = [];
              bufferLength = 0;
            } else if (strings.length) {
              if (encoding === 'utf8' && strings[0].length > 0 && strings[0][0] === '\uFEFF') {
                strings[0] = strings[0].substring(1);
              }

              response.body = strings.join('');
            }

            if (response.body) {
              result.body = response.body;
            }

            resolve(result);
          } catch (e) {
            result.error = true;
            result.message = new Error('Problem to read data from response');
            reject(result);
          }
        });
      });

      req.end();

      req.setTimeout(1000);
      req.setSocketKeepAlive(true, 1000);

      req.on('error', err => {
        result.error = true;
        result.message = err;
        console.info(`socket ${url} error ${err}`);
        reject(result);
      });
    }).catch((err) => {
      const errMsg = err.message || '';
      console.error(`Failed to request ${JSON.stringify(options)} ${errMsg}`);
      return {statusCode: null, body: null, headers: null};
    });
  }

  async getPageWithHeaders(url, cookie, al, ua, headers, path) {
    const optionsParse = urlM.parse(url);
    const isSecureProtocol = (optionsParse.protocol === 'https:');
    const protocolPackage = (isSecureProtocol) ? https : httpfollow;

    const options = {
      ...optionsParse,
      'method': 'GET',
      'hostname': headers.host,
      'headers': {
        ...headers,
        connection: 'keep-alive',
        'cache-control': 'no-cache',
        'User-Agent': ua || userAgent.userAgent() || '',
        'Accept-Language': al || acceptLanguage.acceptLanguage() || '',
        'Cookie': cookie,
      },
    };
    debugger;

    if (this.proxy && isSecureProtocol) {
      const agentOptions = urlM.parse(this.proxy);
      agentOptions.protocol = 'TLSv1_2_method';
      agentOptions.ciphers = 'ALL';

      const agent = new HttpsProxyAgent(agentOptions);
      options.agent = agent;

      options.proxy = this.proxy;
      options.tunnel = true;
    }

    // options.timeout = 2000;
    // options.connectTimeout = 1000;

    if (this.proxy && isSecureProtocol) {
      options.secureProtocol = 'TLSv1_2_method';
    }

    // console.dir(options, { depth: 2 });
    // debugger;

    return new Promise((resolve, reject) => {
      const result = {statusCode: null, body: null, headers: null};
      // console.log('options: ' + JSON.stringify(options));

      debugger;
      const req = protocolPackage.request(options, response => {
        console.info(`'${url}' "response" event! ${response.statusCode}`);
        const encoding = 'utf8';
        result.statusCode = response.statusCode;

        let buffers = [];
        let bufferLength = 0;
        const strings = [];

        console.log('resp HEADERS: ' + JSON.stringify(response.headers));
        result.headers = response.headers;
        response.on('data', chunk => {
          if (!Buffer.isBuffer(chunk)) {
            strings.push(chunk);
          } else if (chunk.length) {
            bufferLength += chunk.length;
            buffers.push(chunk);
          }
        });

        response.on('end', () => {
          try {
            response.body = null;
            debugger;

            if (bufferLength) {
              response.body = Buffer.concat(buffers, bufferLength);

              if (encoding) {
                response.body = response.body.toString(encoding);
              }

              buffers = [];
              bufferLength = 0;
            } else if (strings.length) {
              if (encoding === 'utf8' && strings[0].length > 0 && strings[0][0] === '\uFEFF') {
                strings[0] = strings[0].substring(1);
              }

              response.body = strings.join('');
            }

            if (response.body) {
              result.body = response.body;
            }

            resolve(result);
          } catch (e) {
            result.error = true;
            result.message = new Error('Problem to read data from response');
            reject(result);
          }
        });
      });

      req.end();

      req.setTimeout(1000);
      req.setSocketKeepAlive(true, 1000);

      req.on('error', err => {
        result.error = true;
        result.message = err;
        console.info(`https ${url} error ${err}`);
        reject(result);
      });
    }).catch((err) => {
      const errMsg = err.message || '';
      console.error(`Failed to request ${JSON.stringify(options)} ${errMsg}`);
      return {statusCode: null, body: null, headers: null};
    });
  }

  async postRequestWithAgent(url, cookie, al, ua, proxy) {
    const options = urlM.parse(url);
    const isSecureProtocol = (options.protocol === 'https:');
    const protocolPackage = (isSecureProtocol) ? https : http;

    const data = JSON.stringify({
      proxy,
    });

    if (this.proxy && isSecureProtocol) {
      const agentOptions = urlM.parse(this.proxy);
      agentOptions.protocol = 'TLSv1_2_method';
      agentOptions.ciphers = 'ALL';

      const agent = new HttpsProxyAgent(agentOptions);
      options.agent = agent;

      options.proxy = this.proxy;
      options.tunnel = true;
    }

    options.headers = {
      accept: 'application/json',
      'User-Agent': ua || userAgent.userAgent() || '',
      'Accept-Language': al || acceptLanguage.acceptLanguage() || '',
      'Content-Length': data.length,
    };

    options.method = 'POST';
    if (this.proxy && isSecureProtocol) {
      options.secureProtocol = 'TLSv1_2_method';
    }

    console.dir(options, {depth: 2});
    // debugger;

    return new Promise((resolve, reject) => {
      const result = {statusCode: null, body: null, headers: null};
      const req = protocolPackage.request(options, response => {
        console.info(`"response" event! ${response.statusCode}`);
        const encoding = 'utf8';
        result.statusCode = response.statusCode;

        let buffers = [];
        let bufferLength = 0;
        const strings = [];

        // console.log('HEADERS: ' + JSON.stringify(response.headers));
        result.headers = response.headers;
        response.on('data', chunk => {
          if (!Buffer.isBuffer(chunk)) {
            strings.push(chunk);
          } else if (chunk.length) {
            bufferLength += chunk.length;
            buffers.push(chunk);
          }
        });

        response.on('end', () => {
          try {
            response.body = null;

            if (bufferLength) {
              response.body = Buffer.concat(buffers, bufferLength);

              if (encoding) {
                response.body = response.body.toString(encoding);
              }

              buffers = [];
              bufferLength = 0;
            } else if (strings.length) {
              if (encoding === 'utf8' && strings[0].length > 0 && strings[0][0] === '\uFEFF') {
                strings[0] = strings[0].substring(1);
              }

              response.body = strings.join('');
            }

            if (response.body) {
              result.body = response.body;
            }

            resolve(result);
          } catch (e) {
            result.error = true;
            result.message = new Error('Problem to read data from response');
            reject(result);
          }
        });
      });

      req.write(data);
      req.end();

      // req.setTimeout(1000);
      // req.setSocketKeepAlive(true, 1000);

      req.on('error', err => {
        result.error = true;
        result.message = err;
        console.info(`socket ${url} error ${err}`);
        reject(result);
      });
    }).catch(() => {});
  }
}

module.exports = Connection;
