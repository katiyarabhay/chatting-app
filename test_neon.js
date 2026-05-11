const { neon } = require('@neondatabase/serverless');
const sql = neon('postgres://dummy:dummy@dummy.com/dummy');
const sqlWrapper = async (strings, ...values) => {
  return await sql(strings, ...values);
};
sqlWrapper`SELECT * FROM test WHERE id = ${1}`.then(console.log).catch(e => console.log('ERROR:', e.message));
