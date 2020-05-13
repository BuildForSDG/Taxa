const express = require('express');
const db = require('../db');
const auth = require('../middlewares/auth');
const { validate } = require('../validations/localGovernment');

const router = express.Router();
const tableName = 'local_governments';

router.get('/', async (_request, response) => {
  const queryString = `SELECT id, name FROM ${tableName}`;
  const queryParams = [];
  db.query(queryString, queryParams, (error, result) => {
    if (error) { return response.status(400).send(error); }
    return response.status(200).send(result.rows);
  });
});

router.get('/:id', async (request, response, next) => {
  const id = parseInt(request.params.id, 10);
  const queryString = `SELECT name FROM ${tableName} WHERE id = $1`;
  const queryParams = [id];
  return db.query(queryString, queryParams, (error, result) => {
    if (error) { return next(response.status(400).send(error)); }
    if (result.rowCount < 1) { return response.status(404).send(`Local Government with ${request.params.id} does not exist.`); }
    return response.status(200).send(result.rows[0]);
  });
});

router.delete('/:id', auth, async (request, response) => {
  const id = parseInt(request.params.id, 10);
  const queryString = `DELETE FROM ${tableName} WHERE id = $1`;
  const queryParams = [id];
  db.query(queryString, queryParams, (error, result) => {
    if (error) { return response.status(400).send(error); }
    if (result.rowCount < 1) { return response.status(404).send('Local Government does not exist. Delete task is aborted.'); }
    return response.status(200).send('Local Government was successfully deleted.');
  });
});

router.post('/', auth, async (request, response, next) => {
  const validationResult = validate(request.body);
  if (validationResult.error) {
    return response.status(400).send(validationResult.error.details[0].message);
  }
  const stateId = parseInt(request.params.state_id, 10);
  const queryString = `INSERT INTO ${tableName}(state_id, name) VALUES ($1, $2)`;
  const queryParams = [stateId, request.body.name];
  return db.query(queryString, queryParams, (error, result) => {
    if (error) { return next(response.status(400).send(error.detail)); }
    return response.status(200).send(`Local Government created successfully., ${result.rowCount} item added.`);
  });
});

module.exports = router;
