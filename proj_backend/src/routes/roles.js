const express = require('express');
const uuidv1 = require('uuid/v1');
const db = require('../db');
const auth = require('../middlewares/auth');
const { validate } = require('../validations/role');

const router = express.Router();
const tableName = 'roles';

router.get('/', auth, async (_request, response) => {
  const queryString = `SELECT id, name FROM ${tableName}`;
  const queryParams = [];
  db.query(queryString, queryParams, (error, res) => {
    if (error) { return response.status(400).send(error); }
    return response.status(200).send(res.rows);
  });
});

router.get('/:id', auth, async (request, response, next) => {
  const queryString = `SELECT name FROM ${tableName} WHERE id = $1`;
  const queryParams = [request.params.id];
  db.query(queryString, queryParams, (error, result) => {
    if (error) { return next(response.status(400).send(error)); }
    if (result.rowCount < 1) { return response.status(404).send(`Role with ${request.params.id} does not exist.`); }
    return response.status(200).send(result.rows[0]);
  });
});

router.delete('/:id', auth, async (request, response) => {
  const queryString = `DELETE FROM ${tableName} WHERE id = $1`;
  const queryParams = [request.params.id];
  db.query(queryString, queryParams, (error, result) => {
    if (error) { return response.status(400).send(error); }
    if (result.rowCount < 1) { return response.status(404).send('Role does not exist. Delete task is aborted.'); }
    return response.status(200).send('Role was successfully deleted.');
  });
});

router.post('/', auth, async (request, response, next) => {
  const validationResult = validate(request.body);
  if (validationResult.error) {
    return response.status(400).send(validationResult.error.details[0].message);
  }
  const id = uuidv1();
  const queryString = `INSERT INTO ${tableName}(id, name) VALUES ($1, $2)`;
  const queryParams = [id, request.body.name];
  return db.query(queryString, queryParams, (error, result) => {
    if (error) { return next(response.status(400).send(error.detail)); }
    return response.status(200).send(`Role created successfully. ${result.rowCount} item added.`);
  });
});

router.put('/:id', auth, async (request, response, next) => {
  const validationResult = validate(request.body);
  if (validationResult.error) {
    return next(response.status(400).send(validationResult.error.details[0].message));
  }
  const {
    name
  } = request.body;
  const queryString = `UPDATE ${tableName} SET name=$1 WHERE id=$2`;
  const queryParams = [name, request.params.id];
  return db.query(queryString, queryParams, (error, result) => {
    if (error) return next(response.status(400).send(error));
    if (result.rowCount < 1) return response.status(404).send(`Role with ID ${request.params.id} does not exist.`);
    return response.status(200).send('Role successfully updated.');
  });
});

module.exports = router;
