const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://dummy:dummy@dummy.com/dummy');
const wrapper = async (strings, ...values) => {
  return await sql(strings, ...values);
};
wrapper`SELECT * FROM users WHERE id = ${1}`.catch(e => console.log('CAUGHT:', e.message));
