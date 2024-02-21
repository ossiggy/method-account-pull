import fs from 'fs';
import { json2csv } from 'json-2-csv';
import { IAccount, TAccountCapabilities } from 'method-node';
import { method } from './config';

interface RecordType {
  id: string;
  holder_id: string;
}

let records: RecordType[] = [];

const hasCapabilities = (account: IAccount) => {
  const capabilities: TAccountCapabilities[] = ['data:sync'];
  return capabilities.filter(capability => account.capabilities.includes(capability)).length > 0;
};

const getAccounts = async (holder_id:string, page:number, results:RecordType[]): Promise<RecordType[]> => {
  console.log('Account page', page);
  let accounts:RecordType[] | never[] = results;
  const list = await method.accounts.list({ holder_id, page });
  const isCapable = list.filter(account => hasCapabilities(account));
  const ids = isCapable.map(account => ({ id: account.id, holder_id }));
  accounts = [...accounts, ...ids];
  if (list.length) {
    return getAccounts(holder_id, page+1, accounts)
  }
  return accounts;
}

const getEntities = async (page=1): Promise<void> => {
  try{
  console.log('Entity page', page)
  const entities = await method.entities.list({ page });
  const accounts = await Promise.all(entities.map(async entity => {
    try{
      return await getAccounts(entity.id, 1, []);
    } catch (err) {
      console.error('Error getting accounts', err);
      return []
    }
  }));
  records = [...records, ...accounts.flat()]
  if (entities.length) {
    console.log(entities.length);
    return await getEntities(page+1);
  };
  const csv = json2csv(records);
  fs.writeFile('./results.csv', csv, err => {
    if (err) console.error(err);
  })
} catch (err) {
  console.error('Error getting entities', err);
}
};

getEntities();
