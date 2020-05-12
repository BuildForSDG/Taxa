/* eslint-disable camelcase */
const express = require('express');
const db = require('../db');
const { validate } = require('../validations/payment');
const { getMonth, getYear } = require('../services/dateOperations');

const router = express.Router();
const tableName = 'payments';

router.get('/', async (_request, response) => {
  const queryString = `SELECT * FROM ${tableName}`;
  const queryResult = await db.query(queryString);
  if (queryResult.error) {
    return response.status(400).send(queryResult.error.details[0].message);
  }
  return response.status(200).send(queryResult.rows);
});

router.get('/thismonth', async (request, response) => {
  const { date } = request.body;
  if (!date) {
    return response.status(400).send('Please supply date for this request.');
  }
  // remember to add filter for user's local_government_id here pre-production deployment
  const month = getMonth(date);
  const year = getYear(date);
  const queryString = `SELECT * FROM ${tableName} WHERE (payment_month=$1 AND payment_year=$2)`;
  const queryParams = [month, year];
  const queryResult = await db.query(queryString, queryParams);
  if (queryResult.error) {
    return response.status(400).send(queryResult.error.details[0].message);
  }
  return response.status(200).send(queryResult.rows);
});

router.get('/thisyear', async (request, response) => {
  const { date } = request.body;
  if (!date) {
    return response.status(400).send('Please supply date for this request.');
  }
  // remember to add filter for user's local_government_id here pre-production deployment
  const year = getYear(date);
  const queryString = `SELECT * FROM ${tableName} WHERE payment_year=$1`;
  const queryParams = [year];
  const queryResult = await db.query(queryString, queryParams);
  if (queryResult.error) {
    return response.status(400).send(queryResult.error.details[0].message);
  }
  return response.status(200).send(queryResult.rows);
});

router.get('/:id', async (request, response, next) => {
  const queryString = `SELECT tax_id, user_id, payment_channel_id, payment_date, amount FROM ${tableName} WHERE id = $1`;
  const queryParams = [request.params.id];
  const queryResult = await db.query(queryString, queryParams);
  if (queryResult.error) {
    return next(response.status(400).send(queryResult.error.details[0].message));
  }
  if (queryResult.rowCount < 1) { return response.status(404).send(`Role with ${request.params.id} does not exist.`); }
  return response.status(200).send(queryResult.rows[0]);
});

router.post('/prepaymentcheck', async (request, response) => {
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

router.post('/', async (request, response, next) => {
  const validationResult = validate(request.body);
  if (validationResult.error) {
    return response.status(400).send(validationResult.error.details[0].message);
  }
  const {
    tax_id,
    user_id,
    payment_channel_id,
    payment_date,
    amount
  } = request.body;
  const year = parseInt(getYear(payment_date), 10);
  const month = parseInt(getMonth(payment_date), 10);
  const queryString = `INSERT INTO ${tableName}(tax_id, user_id, payment_channel_id, payment_date, amount, payment_month, payment_year) VALUES ($1, $2, $3, $4, $5, $6, $7)`;
  const queryParams = [tax_id, user_id, payment_channel_id, payment_date, amount, month, year];
  const queryResult = await db.query(queryString, queryParams);
  if (queryResult.error) {
    return next(response.status(400).send(queryResult.error.details[0].message));
  }
  return response.status(200).send('Payment was successful');
});

module.exports = router;
