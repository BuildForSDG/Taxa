const nodemailer = require('nodemailer');
const {
  emailServer,
  emailPort,
  emailUsername,
  emailPassword
} = require('../../config');

const transport = nodemailer.createTransport({
  pool: true,
  host: emailServer,
  port: emailPort,
  secure: true, // use TLS
  auth: {
    user: emailUsername,
    pass: emailPassword
  },
  tls: {
    // do not fail on invalid certs
    rejectUnauthorized: false
  }
});

exports.transport = transport;
