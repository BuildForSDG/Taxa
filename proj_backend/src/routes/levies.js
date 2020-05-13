/* eslint-disable camelcase */
const express = require('express');
const db = require('../db');
const auth = require('../middlewares/auth');
const { validate, validateDelete } = require('../validations/levy');

const router = express.Router();
const tableName = 'levies';

router.get('/tax/:id', auth, async (request, response) => {
  const taxid = parseInt(request.params.id, 10);
  const queryString = `SELECT id, name, description, amount FROM ${tableName} WHERE tax_id=$1`;
  const queryParams = [taxid];
  db.query(queryString, queryParams, (error, result) => {
    if (error) {
      return response.status(400).send(error);
    }
    return response.status(200).send(result.rows);
  });
});

// This is only for debugging purpose. Should be removed in production
router.get('/', async (request, response) => {
  const queryString = `SELECT id, name, description, amount FROM ${tableName}`;
  db.query(queryString, (error, result) => {
    if (error) {
      return response.status(400).send(error);
    }
    return response.status(200).send(result.rows);
  });
});

router.get('/:id', auth, async (request, response, next) => {
  const id = parseInt(request.params.id, 10);
  const queryString = `SELECT name, description, amount, tax_id FROM ${tableName} WHERE id = $1`;
  const queryParams = [id];
  return db.query(queryString, queryParams, (error, result) => {
    if (error) {
      return next(response.status(400).send(error));
    }
    if (result.rowCount < 1) {
      return response.status(404).send(`Levy with ${request.params.id} does not exist.`);
    }
    return response.status(200).send(result.rows[0]);
  });
});

router.delete('/:id', auth, async (request, response, next) => {
  const validationResult = validateDelete(request.body);
  if (validationResult.error) {
    return next(response.status(400).send(validationResult.error.details[0].message));
  }
  const finalresponse = (async () => {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const id = parseInt(request.params.id, 10);
      const queryString = `DELETE FROM ${tableName} WHERE id=$1`;
      const queryParams = [id];
      const queryResult = await client.query(queryString, queryParams);
      if (queryResult.rowCount < 1) {
        client.release();
        return response.status(400).send('Delete task aborted. Levy was not successfully deleted.');
      }
      const { tax_id } = request.body;
      const tQueryString = 'SELECT * FROM levies WHERE tax_id=$1';
      const tQueryParams = [tax_id];
      const taxLevies = await client.query(tQueryString, tQueryParams);
      if (taxLevies.rows.length < 1) {
        client.release();
        return response.status(404).send('Tax sum not computed. We could not get the related tax entity for this levy.');
      }
      const taxAmount = taxLevies.rows.map((m) => parseFloat(m.amount))
        .reduce((prv, nxt) => prv + nxt);
      const nQueryString = 'UPDATE taxes SET total=$1 WHERE id=$2';
      const nQueryParams = [(taxAmount.toFixed(2)), tax_id];
      await client.query(nQueryString, nQueryParams);
      await client.query('COMMIT');
      return response.status(200).send('Levy was successfully deleted.');
    } catch (e) {
      await client.query('ROLLBACK');
      return response.status(500).send(`An error occured. Entire transaction was rolled back. Reason: ${e}`);
    } finally {
      client.release();
    }
  })().catch(() => response.status(400).send('Delete task aborted. Levy was not successfully created.'));
  return finalresponse;
});

router.post('/', auth, async (request, response, next) => {
  const validationResult = validate(request.body);
  if (validationResult.error) {
    return next(response.status(400).send(validationResult.error.details[0].message));
  }
  const finalResponse = (async () => {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const {
        name, description, amount, tax_id
      } = request.body;
      const queryString = `INSERT INTO ${tableName}(name, description, amount, tax_id) VALUES ($1, $2, $3, $4)`;
      const queryParams = [name, description, amount, tax_id];
      const queryResult = await client.query(queryString, queryParams);
      if (queryResult.rowCount < 1) {
        client.release();
        return response.status(400).send('Task aborted. Levy was not successfully created.');
      }
      const tQueryString = 'SELECT * FROM levies WHERE tax_id=$1';
      const tQueryParams = [tax_id];
      const taxLevies = await client.query(tQueryString, tQueryParams);
      if (taxLevies.rows.length < 1) {
        client.release();
        return response.status(404).send('Tax sum not computed. We could not get the related tax entity for this levy.');
      }
      const taxAmount = taxLevies.rows.map((m) => parseFloat(m.amount))
        .reduce((prv, nxt) => prv + nxt);
      const nQueryString = 'UPDATE taxes SET total=$1 WHERE id=$2';
      const nQueryParams = [(taxAmount.toFixed(2)), tax_id];
      await client.query(nQueryString, nQueryParams);
      await client.query('COMMIT');
      return response.status(200).send('Levy successfully created.');
    } catch (e) {
      await client.query('ROLLBACK');
      return response.status(500).send(`An error occured. Entire transaction was rolled back. Reason: ${e}`);
    } finally {
      client.release();
    }
  })().catch(() => response.status(400).send('Task aborted. Levy was not successfully created.'));
  return finalResponse;
});

module.exports = router;
