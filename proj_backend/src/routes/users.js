/* eslint-disable camelcase */
const express = require('express');
const uuidv1 = require('uuid/v1');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cryptoJs = require('crypto-js');
const passwordGenerator = require('generate-password');
const Email = require('email-templates');
const mailEngine = require('../services/email');
const { jwtPrivateKey, siteBaseUrl, qEncryptSecret } = require('../../config');
const db = require('../db');
const { validate } = require('../validations/user');

const router = express.Router();
const tableName = 'users';

router.get('/', async (_request, response) => {
  const queryString = `SELECT id, uniqueId, firstName, lastName, email, phoneNumber, businessName, lastLogin, isEnabled, address, localGovernmentId, isGovernmentOfficial, designation, createdon 
    local_governments.name AS local_government_name FROM ${tableName} LEFT JOIN local_governments ON ${tableName}.local_government_id = local_governments.id`;
  db.query(queryString, (error, result) => {
    if (error) {
      return response.status(400).send(error);
    }
    return response.status(200).send(result.rows[0]);
  });
});

router.get('/qrcodeByEmail', async (request, response) => {
  const queryString = `SELECT id, email, phone_number, business_name FROM ${tableName} WHERE phone_number=$1`;
  const queryParams = [request.body.email];
  db.query(queryString, queryParams, (error, res) => {
    if (error) {
      return response.status(400).send(error);
    }
    const cipherText = cryptoJs.AES.encrypt(res.rows[0].id, qEncryptSecret).toString();
    return response.status(200).send(cipherText);
  });
});

router.get('/qrcodeByPhone', async (request, response) => {
  const queryString = `SELECT id, email, phone_number, business_name FROM ${tableName} WHERE phone_number=$1`;
  const queryParams = [request.body.phone_number];
  db.query(queryString, queryParams, (error, res) => {
    if (error) {
      return response.status(400).send(error);
    }
    return response.send(res.rows[0]);
  });
});

router.get('/me', async (_request, response) => {
  const queryString = `SELECT id, unique_id, first_name, last_name, email, phone_number, business_name, last_login, is_enabled, address, local_government_id, is_government_official, designation, created_on FROM ${tableName}`;
  db.query(queryString, (error, res) => {
    if (error) {
      return response.status(400).send(error);
    }
    return response.send(res.rows[0]);
  });
});

router.post('/', async (request, response, next) => {
  const validationError = validate(request.body);
  if (validationError) {
    return next(response.status(400).send(validationError.error.details[0].message));
  }
  const finalResponse = (async () => {
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
      const unique_id = '';
      const password = passwordGenerator.generate({
        length: 10, uppercase: true, lowercase: true, symbols: true, numbers: true
      });
      const salt = await bcrypt.genSalt(10);
      const pwd = await bcrypt.hash(password, salt);
      const queryString = `INSERT INTO ${tableName}(id, unique_id, first_name, last_name, email, password, phone_number, business_name, address, local_government_id, is_government_official, designation, created_on, email_confirmed, is_enabled) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`;
      const queryParams = [
        userid,
        unique_id,
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
      const transporter = mailEngine.transport;
      const newMail = new Email({
        transport: transporter,
        send: true,
        preview: false
      });
      newMail.send({
        template: 'registration',
        message: {
          from: 'TAXA <no-reply@taxa.ng.com>',
          to: request.body.email
        },
        locals: {
          activateLink: activatelink,
          email: request.body.email,
          pwd: password
        }
      });
      // add customer role for new user
      const newQueryString = 'INSERT INTO user_roles(role_id, user_id) VALUES((SELECT id FROM roles WHERE name="TaxPayer"), (SELECT id FROM users WHERE email=$1))';
      const newQueryParams = [request.body.email];
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

router.post('/old', async (request, response, next) => {
  const validationError = validate(request.body);
  if (validationError) {
    return next(response.status(400).send(validationError.error.details[0].message));
  }
  try {
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
    const unique_id = '';
    const password = passwordGenerator.generate({
      length: 10, uppercase: true, lowercase: true, symbols: true, numbers: true
    });
    const salt = await bcrypt.genSalt(10);
    const pwd = await bcrypt.hash(password, salt);
    const queryString = `INSERT INTO ${tableName}(id, unique_id, first_name, last_name, email, password, phone_number, business_name, address, local_government_id, is_government_official, designation, created_on, email_confirmed, is_enabled) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`;
    const queryParams = [
      userid,
      unique_id,
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
    db.query(queryString, queryParams, (error, result) => {
      if (error) return response.status(400).send(error);
      if (result.rowCount === 1) {
        const token = jwt.sign({ email: request.body.email }, jwtPrivateKey);
        const activatelink = `${siteBaseUrl}/auth/activate/${request.body.email}/${token}`;
        // send email with reset link
        const transporter = mailEngine.transport;
        const newMail = new Email({
          transport: transporter,
          send: true,
          preview: false
        });
        newMail
          .send({
            template: 'registration',
            message: {
              from: 'TAXA <no-reply@taxa.ng.com>',
              to: request.body.email
            },
            locals: {
              activateLink: activatelink,
              email: request.body.email,
              pwd: password
            }
          })
          .then(() => {
            // add customer role for new user
            const newQueryString = 'INSERT INTO user_roles(role_id, user_id) VALUES((SELECT id FROM roles WHERE name="TaxPayer"), (SELECT id FROM users WHERE email=$1))';
            const newQueryParams = [request.body.email];
            db.query(newQueryString, newQueryParams);
            return response
              .status(200)
              .send(
                `An account has been created for ${request.body.email}. A confirmation link has been sent to your email. Please use it to activate your account for use.`
              );
          });
      }
      return null;
    });
    return response
      .status(200)
      .send(
        `An account has been created for ${request.body.email}. A confirmation link has been sent to your email. Please use it to activate your account for use.`
      );
  } catch (error) {
    return next(response.status(503).send(error));
  }
});

module.exports = router;
