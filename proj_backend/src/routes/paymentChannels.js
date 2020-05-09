const express = require('express');
const db = require('../db');
const { validate } = require('../validations/paymentChannel');

const router = express.Router();
const tableName = 'payment_channels';

router.get('/', async (_request, response) => {
  const queryString = `SELECT id, name FROM ${tableName}`;
  const queryParams = [];
  db.query(queryString, queryParams, (error, result) => {
    if (error) {
      return response.status(400).send(error);
    }
    return response.status(200).send(result.rows);
  });
});

router.get('/:id', async (request, response, next) => {
  const id = parseInt(request.params.id, 10);
  const queryString = `SELECT name FROM ${tableName} WHERE id = $1`;
  const queryParams = [id];
  return db.query(queryString, queryParams, (error, result) => {
    if (error) {
      return next(response.status(400).send(error));
    }
    if (result.rowCount < 1) {
      return response.status(404).send(`Payment channel with ${id} does not exist.`);
    }
    return response.status(200).send(result.rows[0]);
  });
});

router.delete('/:id', async (request, response) => {
  const id = parseInt(request.params.id, 10);
  const queryString = `DELETE FROM ${tableName} WHERE id = $1`;
  const queryParams = [id];
  db.query(queryString, queryParams, (error, result) => {
    if (error) {
      return response.status(400).send(error);
    }
    if (result.rowCount < 1) {
      return response.status(404).send('Payment channel does not exist. Delete task is aborted.');
    }
    return response.status(200).send('Payment channel was successfully deleted.');
  });
});

router.post('/', async (request, response, next) => {
  const validationResult = validate(request.body);
  if (validationResult.error) {
    return next(response.status(400).send(validationResult.error.details[0].message));
  }
  const {
    name
  } = request.body;
  const queryString = `INSERT INTO ${tableName}(name) VALUES ($1)`;
  const queryParams = [name];
  return db.query(queryString, queryParams, (error, result) => {
    if (error) {
      return next(response.status(400).send(error.detail));
    }
    return response.status(200).send(`Payment channel created successfully. ${result.rowCount} item added.`);
  });
});

router.put('/:id', async (request, response, next) => {
  const validationError = validate(request.body);
  if (validationError) {
    return next(response.status(400).send(validationError.error.details[0].message));
  }
  const {
    name
  } = request.body;
  const parsedId = parseInt(request.params.id, 10);
  const queryString = `UPDATE ${tableName} SET name=$1 WHERE id=$2`;
  const queryParams = [name, parsedId];
  return db.query(queryString, queryParams, (error, result) => {
    if (error) return next(response.status(400).send(error));
    if (result.rowCount < 1) return response.status(404).send(`Payment channel with ID ${parsedId} does not exist.`);
    return response.status(200).send('Payment channel successfully updated.');
  });
});

module.exports = router;
