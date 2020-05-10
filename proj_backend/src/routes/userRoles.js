const express = require('express');
const db = require('../db');
const { validate } = require('../validations/userRole');

const router = express.Router();
const tableName = 'user_roles';

router.get('/', async (_request, response) => {
  const queryString = `SELECT id, user_id, role_id FROM ${tableName}`;
  const queryParams = [];
  db.query(queryString, queryParams, (error, res) => {
    if (error) { return response.status(400).send(error); }
    return response.status(200).send(res.rows);
  });
});

router.get('/:id', async (request, response, next) => {
  const queryString = `SELECT user_id, role_id FROM ${tableName} WHERE id = $1`;
  const queryParams = [request.params.id];
  db.query(queryString, queryParams, (error, result) => {
    if (error) { return next(response.status(400).send(error)); }
    if (result.rowCount < 1) { return response.status(404).send(`Role with ${request.params.id} does not exist.`); }
    return response.status(200).send(result.rows[0]);
  });
});

router.delete('/:id', async (request, response) => {
  const queryString = `DELETE FROM ${tableName} WHERE id = $1`;
  const queryParams = [request.params.id];
  db.query(queryString, queryParams, (error, result) => {
    if (error) { return response.status(400).send(error); }
    if (result.rowCount < 1) { return response.status(404).send('Role does not exist. Delete task is aborted.'); }
    return response.status(200).send('Role was successfully deleted.');
  });
});

router.post('/', async (request, response, next) => {
  const validationResult = validate(request.body);
  if (validationResult.error) {
    return response.status(400).send(validationResult.error.details[0].message);
  }
  // eslint-disable-next-line camelcase
  const { user_id, role_id } = request.body;
  const queryString = `INSERT INTO ${tableName}(user_id, role_id) VALUES ($1, $2)`;
  // eslint-disable-next-line camelcase
  const queryParams = [user_id, role_id];
  return db.query(queryString, queryParams, (error, result) => {
    if (error) { return next(response.status(400).send(error.detail)); }
    return response.status(200).send(`Role created successfully. ${result.rowCount} item added.`);
  });
});

module.exports = router;
