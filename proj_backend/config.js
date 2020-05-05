const dotenv = require("dotenv");
dotenv.config();
module.exports = {
  jwtPrivateKey: process.env.jwtPrivateKey,
  dbConnString: process.env.postgresDbConnString,
  dbUser: process.env.postgreDbUser,
  dbHost: process.env.postgreDbHost,
  dbDatabase: process.env.postgreDbDatabase,
  dbPassword: process.env.postgreDbPassword,
  dbPort: process.env.postgreDbPort,
  siteBaseUrl: process.env.siteBaseUrl,
  mailtrapHost: process.env.mailtrapHost,
  mailtrapPort: process.env.mailtrapPort,
  mailtrapUsername: process.env.mailtrapUsername,
  mailtrapPassword: process.env.mailtrapPassword
};
