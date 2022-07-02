const mssql = require("mssql");
const config = require("./config.json");

// const config = {
//   server: process.env.SERVER,
//   database: process.env.DATABASE,
//   user: process.env.USER,
//   password: process.env.PASSWORD,
//   port: Number(process.env.SERVER_PORT),
//   pool: {
//     max: 10,
//     min: 0,
//     idleTimeoutMillis: 30000,
//   },
//   connectionTimeout: 150000,
//   options: {
//     encrypt: true, // for azure
//     trustServerCertificate: true, // change to true for local dev / self-signed certs
//   },
// };

mssql.on("error", (error) => {
  console.log("Connection Problem\n" + error.message);
});

const pool = mssql.connect(config, (error) => {
  if (error) {
    console.log(error.message);
    mssql.close();
  } else {
    console.log("Mssql Connected");
  }
});

module.exports = { mssql, pool };
