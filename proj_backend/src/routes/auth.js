/* eslint-disable no-unused-vars */

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const Email = require('email-templates');
const PasswordComplexity = require('joi-password-complexity');
const mailEngine = require('../services/email');
const { jwtPrivateKey, siteBaseUrl } = require('../../config');
const db = require('../db');

const router = express.Router();
const tableName = 'users';

function validate(req) {
  const schema = {
    email: Joi.string().email().required().min(5)
      .max(255)
      .trim(),
    password: Joi.required()
  };
  return Joi.validate(req, schema);
}

const complexityOptions = {
  min: 6,
  max: 20,
  lowerCase: 1,
  upperCase: 1,
  numeric: 1,
  symbol: 1,
  requirementCount: 2
};

function validatePassword(req) {
  const schema = {
    newPassword: new PasswordComplexity(complexityOptions)
  };
  return Joi.validate(req, schema);
}

router.post('/login', async (request, response) => {
  const validationError = validate(request.body);
  if (validationError) return response.status(400).send(validationError.error.details[0].message);
  let upwd = '';
  let uroles = [];
  new Promise((resolve, _reject) => {
    const queryString = `SELECT id, email, password_hash, email_confirmed FROM ${tableName} WHERE email = $1`;
    const queryParams = [request.body.email];
    db.query(queryString, queryParams, (error, result) => {
      if (error) return response.status(400).send(error);
      if (result.rowCount < 1) return response.status(400).send('Invalid username or password.');
      if (result.rows[0].confirmed === false) {
        return response.status(400).send('Account activation is required. Check your email for the activation link.');
      }
      resolve(result.rows[0]);
      upwd = result.rows[0].password;
      return null;
    });
  }).then((newResult) => {
    new Promise((resolve, _reject) => {
      const queryParams2 = [newResult.id];
      const queryString2 = 'SELECT roles.name FROM user_roles INNER JOIN roles on user_roles.role_id=roles.id WHERE user_id=$1';
      db.query(queryString2, queryParams2, (err, resp) => {
        if (err) return response.status(400).send(err);
        if (resp.rowCount < 1) return response.status(400).send('Invalid username or password.');
        resolve(resp.rows);
        uroles = resp.rows.map((rw) => rw.name);
        return null;
      });
    })
      .then(async (_resut) => {
        const validPassword = await bcrypt.compare(request.body.password, upwd);
        if (!validPassword) return response.status(400).send('Invalid password.');
        const queryString = 'UPDATE users SET last_login=$1 WHERE email=$2';
        const queryParams = [new Date(), request.body.email];
        db.query(queryString, queryParams, () => {});
        const token = jwt.sign({ email: request.body.email, roles: uroles }, jwtPrivateKey);
        // Always send token in the header-- best practice
        return response.header('x-auth-token', token).status(200).send('Login successful.');
      })
      .catch((_err) => response.status(400).send('Invalid login.'));
  });
  return null;
});

router.post('/forgotpassword', async (req, res) => {
  new Promise((resolve, _reject) => {
    const queryString = 'SELECT password_hash, created_on FROM users WHERE email=$1';
    const queryParams = [req.body.email];
    db.query(queryString, queryParams, (_err, resp) => {
      resolve(resp);
    });
  }).then((result) => {
    if (result.rowCount === 1) {
      // create token to be sent to user with email and createdon data
      // TODO: Make this a one-time-use token by using the user's
      // current password hash from the database, and combine it
      // with the user's created date to make a very unique secret key!
      const expiryTime = 60 * 60;
      const dateObj = new Date(expiryTime * 1000);
      const hours = dateObj.getUTCHours().toString().padStart(2, '0');
      const minutes = dateObj.getUTCMinutes().toString().padStart(2, '0');

      const secret = `${result.rows[0].password_hash}.${result.rows[0].created_on.getTime()}`;
      const token = jwt.sign({ email: req.body.email }, secret, { expiresIn: expiryTime });
      const resetlink = `${siteBaseUrl}/auth/resetpassword/${req.body.email}/${token}`;

      // send email with reset link
      const transporter = mailEngine.transport;
      const newEmail = new Email({
        transport: transporter,
        send: true,
        preview: false
        // views: {
        //   options: {
        //     extension: 'ejs',
        //   },
        //   root: 'path/to/email/templates',
        // },
      });
      newEmail
        .send({
          template: 'resetpassword',
          message: {
            from: 'TAXA <no-reply@taxa.ng.com>',
            to: req.body.email
          },
          locals: {
            resetLink: resetlink,
            email: req.body.email,
            hours,
            minutes
          }
        })
        .then(() => res.status(200)
          .send(`A passowrd reset link has been sent to your email at ${req.body.email}. This link expires in ${hours} hr(s) ${minutes} mins.`));
    }
  });
});

router.post('/resetpassword/:email/:token', async (req, res) => {
  const error = validatePassword(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  new Promise((resolve, reject) => {
    const queryString = 'SELECT password_hash, created_on FROM users WHERE email=$1';
    const queryParams = [req.params.email];
    db.query(queryString, queryParams, (_err, resp) => {
      resolve(resp);
    });
  }).then((result) => {
    if (result.rowCount === 1) {
      const secret = `${result.rows[0].password_hash}.${result.rows[0].created_on.getTime()}`;
      const tokenn = req.params.token;
      // verify supplied token, cancel process if token is invalid or expired
      jwt.verify(tokenn, secret, async (err, _decoded) => {
        if (err) {
          return res.status(400).send('Sorry the password reset link is invalid. Please get a new one.');
        }
        // now reset user password if there are no token errors
        const salt = await bcrypt.genSalt(10);
        const computedPwd = await bcrypt.hash(req.body.newPassword, salt);
        const queryString = 'UPDATE users SET password_hash=$1 WHERE email=$2';
        const queryParams = [computedPwd, req.params.email];
        db.query(queryString, queryParams, (errr, _resp) => {
          if (errr) {
            return res.status(400).send('Sorry the password reset link is invalid. Please get a new one.');
          }

          const transporter = mailEngine.transport;
          const newerEmail = new Email({
            transport: transporter,
            send: true,
            preview: false
          });
          newerEmail
            .send({
              template: 'success',
              message: {
                from: 'TAXA <no-reply@taxa.ng.com>',
                to: req.body.email
              },
              locals: {
                emailSubject: 'Password Change',
                email: req.body.email,
                emailBody: 'You have successfully changed your password. Please keep it personal and safe.'
              }
            })
            .then(() => res.status(200).send('Your password has been changed. Please keep it personal and safe.'));
          return null;
        });
        return null;
      });
    }
  });
  return null;
});

router.post('/activate/:email/:token', async (req, res) => {
  new Promise((resolve, _reject) => {
    const queryString = 'SELECT email_confirmed FROM users WHERE email=$1';
    const queryParams = [req.params.email];
    db.query(queryString, queryParams, (_err, resp) => {
      resolve(resp);
    });
  }).then(async (result) => {
    if (result.rowCount === 1 && result.rows[0].email_confirmed === false) {
      const { token } = req.params;
      // verify supplied token, cancel process if token is invalid or expired
      jwt.verify(token, jwtPrivateKey, (err, _decoded) => {
        if (err) return res.status(400).send('Sorry the activation link is invalid. Bad token');
        // now confirm user account
        const queryString = 'UPDATE users SET email_confirmed=$1 WHERE email=$2';
        const queryParams = [true, req.params.email];
        db.query(queryString, queryParams, (error, _resp) => {
          if (error) return res.status(400).send('Sorry the activation link is invalid.');
          const transporter = mailEngine.transport;
          const newEmail = new Email({
            transport: transporter,
            send: true,
            preview: false
          });
          newEmail
            .send({
              template: 'success',
              message: {
                from: 'TAXA <no-reply@taxa.ng.com>',
                to: req.params.email
              },
              locals: {
                emailSubject: 'Account Activation',
                email: req.params.email,
                emailBody: 'You have successfully activated your account for use.'
              }
            })
            .then(() => res.status(200).send('Your account activation was successful.'));
          return null;
        });
        return null;
      });
    } else {
      return res.status(400).send('Account has already been activated.');
    }
    return null;
  });
});

module.exports = router;
