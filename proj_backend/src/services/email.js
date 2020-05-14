const nodemailer = require('nodemailer');
const Email = require('email-templates');
const {
  emailServer, emailPort, emailUsername, emailPassword, emailFrom
} = require('../../config');

const from = `'TAXA <${emailFrom}>'`;

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

const simpleTransport = nodemailer.createTransport({
  host: emailServer,
  port: emailPort,
  auth: {
    user: emailUsername,
    pass: emailPassword
  }
});

const sendMailWithSmtp = async (template, to, locals) => {
  const mail = new Promise((resolve, reject) => {
    const newMail = new Email({
      transport,
      send: true,
      preview: false
    });
    newMail
      .send({
        template,
        message: {
          from,
          to
        },
        locals
      })
      .then((res) => resolve(res))
      .catch((e) => reject(e));
  });
  return mail;
};

const sendMail = async (template, to, locals) => {
  const mail = new Promise((resolve, reject) => {
    const newMail = new Email({
      transport: simpleTransport,
      send: true,
      preview: false
    });
    newMail
      .send({
        template,
        message: {
          from,
          to
        },
        locals
      })
      .then((res) => resolve(res))
      .catch((e) => reject(e));
  });
  return mail;
};

exports.sendMailWithSmtp = sendMailWithSmtp;
exports.sendMail = sendMail;
