/* eslint-disable camelcase */
const express = require('express');
const db = require('../db');
const auth = require('../middlewares/auth');
const { sendMail } = require('../services/email');
const { validate } = require('../validations/payment');
const { getMonth, getYear, getMonthName } = require('../services/dateOperations');

const router = express.Router();
const tableName = 'payments';

router.get('/', auth, async (_request, response) => {
  const queryString = `SELECT payments.id, payments.tax_id, payments.user_id, payments.payment_channel_id, payments.payment_date, payments.amount, payments.payment_month, payments.payment_year, taxes.name AS tax_name, users.email AS user_email, users.business_name AS users_bunsiness_name, payment_channels.name AS payment_channel FROM ${tableName} LEFT JOIN taxes ON payments.tax_id = taxes.id LEFT JOIN users ON payments.user_id = users.id LEFT JOIN payment_channels ON payments.payment_channel_id = payment_channels.id`;
  const queryResult = await db.query(queryString);
  if (queryResult.error) {
    return response.status(400).send(queryResult.error.details[0].message);
  }
  return response.status(200).send(queryResult.rows);
});

router.get('/thismonth', auth, async (request, response) => {
  const { date } = request.body;
  if (!date) {
    return response.status(400).send('Please supply date for this request.');
  }
  // remember to add filter for user's local_government_id here pre-production deployment
  const month = getMonth(date);
  const year = getYear(date);
  const queryString = `SELECT payments.id, payments.tax_id, payments.user_id, payments.payment_channel_id, payments.payment_date, payments.amount, payments.payment_month, payments.payment_year, taxes.name AS tax_name, users.email AS user_email, users.business_name AS users_bunsiness_name, payment_channels.name AS payment_channel FROM ${tableName} LEFT JOIN taxes ON payments.tax_id = taxes.id LEFT JOIN users ON payments.user_id = users.id LEFT JOIN payment_channels ON payments.payment_channel_id = payment_channels.id WHERE (payment_month=$1 AND payment_year=$2)`;
  const queryParams = [month, year];
  const queryResult = await db.query(queryString, queryParams);
  if (queryResult.error) {
    return response.status(400).send(queryResult.error.details[0].message);
  }
  return response.status(200).send(queryResult.rows);
});

router.get('/thisyear', auth, async (request, response) => {
  const { date } = request.body;
  if (!date) {
    return response.status(400).send('Please supply date for this request.');
  }
  // remember to add filter for user's local_government_id here pre-production deployment
  const year = getYear(date);
  const queryString = `SELECT payments.id, payments.tax_id, payments.user_id, payments.payment_channel_id, payments.payment_date, payments.amount, payments.payment_month, payments.payment_year, taxes.name AS tax_name, users.email AS user_email, users.business_name AS users_bunsiness_name, payment_channels.name AS payment_channel FROM ${tableName} LEFT JOIN taxes ON payments.tax_id = taxes.id LEFT JOIN users ON payments.user_id = users.id LEFT JOIN payment_channels ON payments.payment_channel_id = payment_channels.id WHERE payment_year=$1`;
  const queryParams = [year];
  const queryResult = await db.query(queryString, queryParams);
  if (queryResult.error) {
    return response.status(400).send(queryResult.error.details[0].message);
  }
  return response.status(200).send(queryResult.rows);
});

router.get('/:id', auth, async (request, response, next) => {
  const queryString = `SELECT tax_id, user_id, payment_channel_id, payment_date, amount FROM ${tableName} WHERE id = $1`;
  const queryParams = [request.params.id];
  const queryResult = await db.query(queryString, queryParams);
  if (queryResult.error) {
    return next(response.status(400).send(queryResult.error.details[0].message));
  }
  if (queryResult.rowCount < 1) { return response.status(404).send(`Role with ${request.params.id} does not exist.`); }
  return response.status(200).send(queryResult.rows[0]);
});

router.post('/prepaymentcheck', auth, async (request, response) => {
  const validationResult = validate(request.body);
  if (validationResult.error) {
    return response.status(400).send(validationResult.error.details[0].message);
  }
  const {
    tax_id,
    user_id,
    payment_date
  } = request.body;
  // get month and year of payment
  const year = parseInt(getYear(payment_date), 10);
  const month = parseInt(getMonth(payment_date), 10);
  const queryString = `SELECT tax_id, user_id, payment_month, payment_year FROM ${tableName} WHERE (tax_id=$1 AND user_id=$2 AND payment_month=$3 AND payment_year=$4)`;
  const queryParams = [tax_id, user_id, month, year];
  const queryResult = await db.query(queryString, queryParams);
  if (queryResult.error) {
    return response.status(400).send(validationResult.error.details[0].message);
  }
  if (queryResult.rowCount >= 1) {
    return response.status(404).send('Client has already paid tax for the month.');
  }
  return response.status(200).send('Client is owing tax for the month, please continue with payment.');
});

router.post('/', auth, async (request, response, next) => {
  const validationResult = validate(request.body);
  if (validationResult.error) {
    return response.status(400).send(validationResult.error.details[0].message);
  }
  const finalResponse = (async () => {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const {
        tax_id,
        user_id,
        payment_channel_id,
        payment_date
      } = request.body;
      const uQueryString = 'SELECT email FROM users WHERE id=$1';
      const uQueryParams = [user_id];
      const getUserResult = await client.query(uQueryString, uQueryParams);
      if (getUserResult.rowCount < 1) {
        client.release();
        return response.status(400).send('Sorry we could not find a matching tax. Entire payment transaction was rolled back.');
      }
      const year = parseInt(getYear(payment_date), 10);
      const month = parseInt(getMonth(payment_date), 10);
      const tQueryString = 'SELECT * FROM taxes WHERE id=$1';
      const tQueryParams = [tax_id];
      const getTaxResult = await client.query(tQueryString, tQueryParams);
      if (getTaxResult.rowCount < 1) {
        client.release();
        return response.status(400).send('Sorry we could not find a matching tax. Entire payment transaction was rolled back.');
      }
      const queryString = `INSERT INTO ${tableName}(tax_id, user_id, payment_channel_id, payment_date, amount, payment_month, payment_year) VALUES ($1, $2, $3, $4, $5, $6, $7)`;
      const queryParams = [
        tax_id, user_id, payment_channel_id, payment_date, getTaxResult.rows[0].total, month, year
      ];
      const queryResult = await db.query(queryString, queryParams);
      if (queryResult.error) {
        client.release();
        return next(response.status(400).send(queryResult.error.details[0].message));
      }
      // send email
      const locals = {
        emailSubject: 'Tax Payment e-Receipt',
        email: getUserResult.rows[0].email,
        emailBody: `We have recorded your Tax Payment for the month of ${getMonthName(month)} ${year}.`
      };
      const template = 'success';
      const to = getUserResult.rows[0].email;
      await sendMail(template, to, locals);
      await client.query('COMMIT');
      return response.status(200).send('Payment was successful');
    } catch (e) {
      await client.query('ROLLBACK');
      return response.status(500).send(`An error occured. Entire transaction was rolled back. Reason: ${e}`);
    } finally {
      client.release();
    }
  })().catch(() => response.status(400).send('Login failed.'));
  return finalResponse;
});

module.exports = router;
