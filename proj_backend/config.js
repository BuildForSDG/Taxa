const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  jwtPrivateKey: process.env.jwtPrivateKey,
  dbConnString: process.env.dbConnString,
  dbUser: process.env.dbUser,
  dbHost: process.env.dbHost,
  dbDatabase: process.env.dbDatabase,
  dbPassword: process.env.dbPassword,
  dbPort: process.env.dbPort,
  siteBaseUrl: process.env.siteBaseUrl,
  emailUsername: process.env.emailUsername,
  emailPassword: process.env.emailPassword,
  emailServer: process.env.emailServer,
  emailPort: process.env.emailPort
};
