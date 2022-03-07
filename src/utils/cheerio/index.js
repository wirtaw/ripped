
const cheerio = require('cheerio');

const cleanLine = (text) => {
  if (text.indexOf('document.write') > -1 && text.indexOf('\' + \'') > -1 && text.indexOf(');') > -1) {
    return text.replace('document.write(\'', '').replace('\' + \'', '').replace('\');', '');
  }

  return text;
};

const getProxyTable = html => {
  const list = [];

  const $ = cheerio.load(html);
  const rows = $('#tbl_proxy_list tbody tr');

  rows.each((i, row) => {
    if (row.children.length === 15 && row.name === 'tr') {
      const item = {ip: '', port: ''};
      let counter = 0;

      row.children.forEach(column => {
        if (counter === 1 && column.type === 'tag') {
          item.ip =
          (column && column?.children[1]?.children[1]?.type && column?.children[1]?.children[1]?.children[0]?.data) ?
            cleanLine(column.children[1].children[1].children[0].data) : '';
        }
        if (counter === 3 && column.type === 'tag') {
          item.port = (column.children[0].type === 'text') ? column.children[0].data.trim() : '';
        }

        counter++;
      });

      list.push({index: i, item});
    }
  });

  return list;
};

module.exports = {
  getProxyTable,
};
