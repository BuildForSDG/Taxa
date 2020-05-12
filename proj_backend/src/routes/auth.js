const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const Email = require('email-templates');
const PasswordComplexity = require('joi-password-complexity');
const { sendMail } = require('../services/email');
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
  if (validationError.error) {
    return response.status(400).send(validationError.error.details[0].message);
  }
  const finalResponse = (async () => {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      let uroles = [];
      const queryString = `SELECT id, email, password_hash, email_confirmed FROM ${tableName} WHERE email = $1`;
      const queryParams = [request.body.email];
      const getUserResult = await client.query(queryString, queryParams);
      if (getUserResult.rowCount < 1) return response.status(400).send('Invalid username or password.');
      if (getUserResult.rows[0].confirmed === false) {
        client.release();
        return response.status(400).send('Account activation is required. Check your email for the activation link.');
      }
      const rQueryParams = [getUserResult.rows[0].id];
      const rQueryString = 'SELECT roles.name FROM user_roles INNER JOIN roles on user_roles.role_id=roles.id WHERE user_id=$1';
      const userRoles = await client.query(rQueryString, rQueryParams);
      if (userRoles.rowCount >= 1) { uroles = userRoles.rows.map((rw) => rw.name); }
      const validPassword = await bcrypt
        .compare(request.body.password, getUserResult.rows[0].password);
      if (!validPassword) {
        client.release();
        return response.status(400).send('Invalid password.');
      }
      const sQueryString = 'UPDATE users SET last_login=$1 WHERE email=$2';
      const sQueryParams = [new Date(), request.body.email];
      await client.query(sQueryString, sQueryParams);
      const token = jwt.sign({ email: request.body.email, roles: uroles }, jwtPrivateKey);
      await client.query('COMMIT');
      // Always send token in the header-- best practice
      return response.header('x-auth-token', token).status(200).send('Login successful.');
    } catch (e) {
      await client.query('ROLLBACK');
      return response.status(500).send(`An error occured. Entire transaction was rolled back. Reason: ${e}`);
    } finally {
      client.release();
    }
  })().catch(() => response.status(400).send('Login failed.'));
  return finalResponse;
});

router.post('/forgotpassword', async (request, response) => {
  const finalResponse = (async () => {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const queryString = 'SELECT password_hash, created_on FROM users WHERE email=$1';
      const queryParams = [request.body.email];
      const getUserDetail = await client.query(queryString, queryParams);
      if (getUserDetail.rowCount < 1) {
        client.release();
        return response.status(404).send('User account not found.');
      }
      // create token to be sent to user with email and createdon data
      // TODO: Make this a one-time-use token by using the user's
      // current password hash from the database, and combine it
      // with the user's created date to make a very unique secret key!
      const expiryTime = 60 * 60;
      const dateObj = new Date(expiryTime * 1000);
      const hours = dateObj.getUTCHours().toString().padStart(2, '0');
      const minutes = dateObj.getUTCMinutes().toString().padStart(2, '0');
      const secret = `${getUserDetail.rows[0].password_hash}.${getUserDetail.rows[0].created_on.getTime()}`;
      const token = jwt.sign({ email: request.body.email }, secret, { expiresIn: expiryTime });
      const resetlink = `${siteBaseUrl}/auth/resetpassword/${request.body.email}/${token}`;
      // send email with reset link
      const locals = {
        resetLink: resetlink,
        email: request.body.email,
        hours,
        minutes
      };
      const template = 'resetpassword';
      const to = request.body.email;
      await sendMail(template, to, locals);
      return response.status(200)
        .send(`A passowrd reset link has been sent to your email at ${request.body.email}. This link expires in ${hours} hr(s) ${minutes} mins.`);
    } catch (e) {
      await client.query('ROLLBACK');
      return response.status(500).send(`An error occured. Entire transaction was rolled back. Reason: ${e}`);
    } finally {
      client.release();
    }
  })().catch(() => response.status(400).send('Task aborted. Levy was not successfully created.'));
  return finalResponse;
});

router.post('/resetpassword/:email/:token', async (request, response) => {
  const validationError = validatePassword(request.body);
  if (validationError) return response.status(400).send(validationError.error.details[0].message);
  const finalResponse = (async () => {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const queryString = 'SELECT password_hash, created_on FROM users WHERE email=$1';
      const queryParams = [request.params.email];
      const queryResult = await client.query(queryString, queryParams);
      if (queryResult.rowCount < 1) {
        client.release();
        return response.status(404).send('Task aborted. Password could not be reset. User account was not found.');
      }
      const secret = `${queryResult.rows[0].password}.${queryResult.rows[0].createdon.getTime()}`;
      const { token } = request.params.token;
      // verify supplied token, cancel process if token is invalid or expired
      const decoded = jwt.verify(token, secret);
      if (!decoded) {
        client.release();
        return response.status(400).send('Sorry the password reset link is invalid. Please get a new one.');
      }
      // now reset user password if there are no token errors
      const salt = await bcrypt.genSalt(10);
      const computedPwd = await bcrypt.hash(request.body.newPassword, salt);
      const nQueryString = 'UPDATE users SET password_hash=$1 WHERE email=$2';
      const nQueryParams = [computedPwd, request.params.email];
      const pwdUpdateResult = client.query(nQueryString, nQueryParams);
      if (pwdUpdateResult.rowCount < 1) {
        client.release();
        return response.status(400).send('Sorry the password reset link is invalid. Please get a new one.');
      }
      // send email
      const locals = {
        emailSubject: 'Password Change',
        email: request.body.email,
        emailBody: 'You have successfully changed your password. Please keep it personal and safe.'
      };
      const template = 'success';
      const to = request.body.email;
      await sendMail(template, to, locals);
      await client.query('COMMIT');
      return response.status(200).send('Your password has been changed. Please keep it personal and safe.');
    } catch (e) {
      await client.query('ROLLBACK');
      return response.status(500).send(`An error occured. Entire transaction was rolled back. Reason: ${e}`);
    } finally {
      client.release();
    }
  })().catch(() => response.status(400).send('Task aborted. Levy was not successfully created.'));
  return finalResponse;
});

router.post('/activate/:email/:token', async (request, response) => {
  const finalResponse = (async () => {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const queryString = 'SELECT email_confirmed FROM users WHERE email=$1';
      const queryParams = [request.params.email];
      const queryResult = await client.query(queryString, queryParams);
      if (queryResult.rowCount < 1) {
        client.release();
        return response.status(400).send('Task aborted. Activation failed for an invalid account.');
      }
      if (queryResult.rows[0].email_confirmed === true) {
        client.release();
        return response.status(400).send('Task aborted. Account has already been activated.');
      }
      const { token } = request.params;
      // verify supplied token, cancel process if token is invalid or expired
      const decodeToken = jwt.verify(token, jwtPrivateKey);
      if (!decodeToken) {
        client.release();
        return response.status(400).send('Task aborted. Activation failed. Token is invalid. Please get a new one.');
      }
      // now confirm user account
      const pQueryString = 'UPDATE users SET email_confirmed=$1 WHERE email=$2';
      const pQueryParams = [true, request.params.email];
      const confirmUserResult = await client.query(pQueryString, pQueryParams);
      if (confirmUserResult.rowCount < 1) {
        client.release();
        return response.status(400).send('Account activation failed.');
      }
      // send email
      const locals = {
        emailSubject: 'Account Activation',
        email: request.params.email,
        emailBody: 'You have successfully activated your account for use.'
      };
      const template = 'success';
      const to = request.body.email;
      await sendMail(template, to, locals);
      await client.query('COMMIT');
      return response.status(200).status(200).send('Your account activation was successful.');
    } catch (e) {
      await client.query('ROLLBACK');
      return response.status(500).send(`An error occured. Entire transaction was rolled back. Reason: ${e}`);
    } finally {
      client.release();
    }
  })().catch(() => response.status(400).send('Task aborted. Account activation failed.'));
  return finalResponse;
});

module.exports = router;
