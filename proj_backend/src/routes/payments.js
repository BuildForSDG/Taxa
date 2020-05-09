/* eslint-disable camelcase */
const express = require('express');
const db = require('../db');
const { validate } = require('../validations/payment');

const router = express.Router();
const tableName = 'payments';

router.get('/', async (_request, response) => {
  const queryString = `SELECT id, tax_id, user_id, payment_channel_id, payment_date, amount FROM ${tableName}`;
  const queryParams = [];
  db.query(queryString, queryParams, (error, res) => {
    if (error) { return response.status(400).send(error); }
    return response.status(200).send(res.rows);
  });
});

router.get('/:id', async (request, response, next) => {
  const queryString = `SELECT tax_id, user_id, payment_channel_id, payment_date, amount FROM ${tableName} WHERE id = $1`;
  const queryParams = [request.params.id];
  db.query(queryString, queryParams, (error, result) => {
    if (error) { return next(response.status(400).send(error)); }
    if (result.rowCount < 1) { return response.status(404).send(`Role with ${request.params.id} does not exist.`); }
    return response.status(200).send(result.row[0]);
  });
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
  const queryString = `INSERT INTO ${tableName}(tax_id, user_id, payment_channel_id, payment_date, amount) VALUES ($1, $2, $3, $4, $5)`;
  const queryParams = [tax_id, user_id, payment_channel_id, payment_date, amount];
  return db.query(queryString, queryParams, (error, result) => {
    if (error) { return next(response.status(400).send(error.detail)); }
    return response.status(200).send(`Role created successfully. ${result.rowCount} item added.`);
  });
});

module.exports = router;
