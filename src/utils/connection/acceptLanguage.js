const acceptLanguageList = require('./acceptLanguageList');

const acceptLanguage = () => {
  const random = parseInt(Math.random() * (acceptLanguageList.length - 1), 10);
  return acceptLanguageList[random];
};

module.exports = { acceptLanguage };