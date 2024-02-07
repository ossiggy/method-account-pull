require('dotenv').config();
const fs = require('fs');
const converter = require('json-2-csv');
const { Method, Environments } = require("method-node");

const method = new Method({
  apiKey: process.env.METHOD_API_KEY || '',
  env: Environments[process.env.METHOD_ENV]
});

let records = [];

const getAccounts = async (holder_id, page=1, results=[]) => {
  let accounts = results;
  const list = await method.accounts.list({ holder_id, page });
  const ids = list.map(account => ({ id: account.id, holder_id }));
  accounts = [...accounts, ...ids];
  if (list.length) {
    return getAccounts(holder_id, page+1, accounts)
  }
  return accounts;
}

const getEntities = async (page=1) => {
  const entities = await method.entities.list({ page });
  const accounts = await Promise.all(entities.map(async entity => {
    return getAccounts(entity.id);
  }));
  records = [...records, ...accounts.flat()]
  if (entities.length) {
    return getEntities(page+1);
  };
  const csv = converter.json2csv(records);
  fs.writeFile('./results.csv', csv, err => {
    if (err) console.error(err);
  })
};

getEntities();
