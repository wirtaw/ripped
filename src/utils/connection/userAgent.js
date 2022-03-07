const userAgentList = require('./userAgentList');

const userAgent = () => {
  const random = parseInt(Math.random() * (userAgentList.length - 1), 10);
  return userAgentList[random];
};

module.exports = { userAgent };