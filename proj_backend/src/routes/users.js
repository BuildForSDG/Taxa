/* eslint-disable camelcase */
const express = require('express');
const uuidv1 = require('uuid/v1');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cryptoJs = require('crypto-js');
const passwordGenerator = require('generate-password');
const { sendMail } = require('../services/email');
const { jwtPrivateKey, siteBaseUrl, qEncryptSecret } = require('../../config');
const db = require('../db');
const { validate } = require('../validations/user');

const router = express.Router();
const tableName = 'users';

router.get('/', async (_request, response) => {
  const queryString = 'SELECT users.id, users.first_name, users.last_name, users.email, users.phone_number, users.business_name, users.last_login, users.is_enabled, users.address, users.local_government_id, users.is_government_official, users.designation, users.created_on, local_governments.name AS local_government_name, states.name AS state_name FROM users LEFT JOIN local_governments ON users.local_government_id = local_governments.id LEFT JOIN states ON local_governments.state_id = states.id';
  db.query(queryString, (error, result) => {
    if (error) {
      return response.status(400).send(error);
    }
    return response.status(200).send(result.rows);
  });
});

router.get('/:id', async (request, response) => {
  const queryString = 'SELECT users.id, users.first_name, users.last_name, users.email, users.phone_number, users.business_name, users.last_login, users.is_enabled, users.address, users.local_government_id, users.is_government_official, users.designation, users.created_on, local_governments.name AS local_government_name, states.name AS state_name FROM users LEFT JOIN local_governments ON users.local_government_id = local_governments.id LEFT JOIN states ON local_governments.state_id = states.id WHERE users.id = $1';
  const queryParams = [request.params.id];
  db.query(queryString, queryParams, (error, result) => {
    if (error) {
      return response.status(400).send(error);
    }
    return response.status(200).send(result.rows);
  });
});

router.get('/be/qrcode/:email', async (request, response) => {
  const queryString = `SELECT id, email, phone_number, business_name FROM ${tableName} WHERE email=$1`;
  const queryParams = [request.params.email];
  db.query(queryString, queryParams, (error, res) => {
    if (error) {
      return response.status(400).send(error);
    }
    const cipherText = cryptoJs.AES.encrypt(res.rows[0].id, qEncryptSecret).toString();
    return response.status(200).send(cipherText);
  });
});

router.get('/bp/qrcode/:phone_number', async (request, response) => {
  const queryString = `SELECT id, email, phone_number, business_name FROM ${tableName} WHERE phone_number=$1`;
  const queryParams = [request.params.phone_number];
  db.query(queryString, queryParams, (error, res) => {
    if (error) {
      return response.status(400).send(error);
    }
    const cipherText = cryptoJs.AES.encrypt(res.rows[0].id, qEncryptSecret).toString();
    return response.status(200).send(cipherText);
  });
});

router.get('/read/qrcode/', async (request, response) => {
  const bytes = cryptoJs.AES.decrypt(request.body.code, qEncryptSecret);
  const originalText = bytes.toString(cryptoJs.enc.Utf8);
  return response.status(200).send(originalText);
});

router.get('/me', async (_request, response) => {
  const queryString = `SELECT id, first_name, last_name, email, phone_number, business_name, last_login, is_enabled, address, local_government_id, is_government_official, designation, created_on FROM ${tableName}`;
  db.query(queryString, (error, res) => {
    if (error) {
      return response.status(400).send(error);
    }
    return response.send(res.rows[0]);
  });
});

router.post('/', async (request, response, next) => {
  const validationError = validate(request.body);
  if (validationError.error) {
    return next(response.status(400).send(validationError.error.details[0].message));
  }
  const finalResponse = await (async () => {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const {
        first_name,
        last_name,
        email,
        phone_number,
        business_name,
        address,
        local_government_id,
        is_government_official,
        designation
      } = request.body;
      const userid = uuidv1();
      const password = passwordGenerator.generate({
        length: 10, uppercase: true, lowercase: true, symbols: true, numbers: true
      });
      const salt = await bcrypt.genSalt(10);
      const pwd = await bcrypt.hash(password, salt);
      const queryString = `INSERT INTO ${tableName}(id, first_name, last_name, email, password_hash, phone_number, business_name, address, local_government_id, is_government_official, designation, created_on, email_confirmed, is_enabled) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`;
      const queryParams = [
        userid,
        first_name,
        last_name,
        email,
        pwd,
        phone_number,
        business_name,
        address,
        local_government_id,
        is_government_official,
        designation,
        new Date(),
        false,
        true
      ];
      const createUserResult = await client.query(queryString, queryParams);
      if (createUserResult.rowCount < 1) {
        client.release();
        return response.status(400).send('Task aborted. User was not successfully created.');
      }
      const token = jwt.sign({ email: request.body.email }, jwtPrivateKey);
      const activatelink = `${siteBaseUrl}/auth/activate/${request.body.email}/${token}`;
      // send email with reset link
      const locals = {
        activateLink: activatelink,
        email: request.body.email,
        pwd: password
      };
      const template = 'registration';
      const to = request.body.email;
      await sendMail(template, to, locals);
      // add customer role for new user
      const newQueryString = 'INSERT INTO user_roles(role_id, user_id) VALUES((SELECT id FROM roles WHERE name=$1), (SELECT id FROM users WHERE email=$2))';
      const newQueryParams = ['TaxPayer', request.body.email];
      const createUserRoleResult = await client.query(newQueryString, newQueryParams);
      if (createUserRoleResult.rowCount < 1) {
        client.release();
        return response.status(400).send('Task aborted. User was not successfully created. Entire transaction has been rolled back.');
      }
      await client.query('COMMIT');
      return response.status(200).send(`An account has been created for ${request.body.email}. A confirmation link has been sent to your email. Please use it to activate your account for use.`);
    } catch (e) {
      await client.query('ROLLBACK');
      return response.status(500).send(`An error occured. Entire transaction was rolled back. Reason: ${e}`);
    } finally {
      client.release();
    }
  })();
  return finalResponse;
});

module.exports = router;
