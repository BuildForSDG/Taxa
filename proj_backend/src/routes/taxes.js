const express = require('express');
const db = require('../db');
const { validate } = require('../validations/tax');

const router = express.Router();
const tableName = 'taxes';

router.get('/', async (_request, response) => {
  const queryString = `SELECT id, name, description, total, local_government_id FROM ${tableName}`;
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
  const queryString = `SELECT name, description, total, local_government_id FROM ${tableName} WHERE id = $1`;
  const queryParams = [id];
  return db.query(queryString, queryParams, (error, result) => {
    if (error) {
      return next(response.status(400).send(error));
    }
    if (result.rowCount < 1) {
      return response.status(404).send(`Tax with ${id} does not exist.`);
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
      return response.status(404).send('Tax does not exist. Delete task is aborted.');
    }
    return response.status(200).send('Tax was successfully deleted.');
  });
});

router.post('/', async (request, response, next) => {
  const validationResult = validate(request.body);
  if (validationResult.error) {
    return next(response.status(400).send(validationResult.error.details[0].message));
  }
  const {
    // eslint-disable-next-line camelcase
    name, description, local_government_id
  } = request.body;
  const total = 0;
  const queryString = `INSERT INTO ${tableName}(name, description, total, local_government_id) VALUES ($1, $2, $3, $4)`;
  // eslint-disable-next-line camelcase
  const queryParams = [name, description, total, local_government_id];
  return db.query(queryString, queryParams, (error, result) => {
    if (error) {
      return next(response.status(400).send(error.detail));
    }
    return response.status(200).send(`Tax created successfully. ${result.rowCount} item added.`);
  });
});

router.put('/:id', async (request, response, next) => {
  const validationResult = validate(request.body);
  if (validationResult.error) {
    return next(response.status(400).send(validationResult.error.details[0].message));
  }
  const {
    name, description, total
  } = request.body;
  const parsedId = parseInt(request.params.id, 10);
  const parsedTotal = parseFloat(total);
  const queryString = `UPDATE ${tableName} SET name=$1, description=$2, total=$3 WHERE id=$4`;
  const queryParams = [name, description, parsedTotal, parsedId];
  return db.query(queryString, queryParams, (error, result) => {
    if (error) return next(response.status(400).send(error));
    if (result.rowCount < 1) return response.status(404).send(`Tax with ID ${request.params.id} does not exist.`);
    return response.status(200).send('Tax successfully updated.');
  });
});

module.exports = router;
