/* eslint-disable camelcase */
const express = require('express');
const db = require('../db');
const { validate } = require('../validations/levy');

const router = express.Router();
const tableName = 'levies';

router.get('/', async (_request, response) => {
  const queryString = `SELECT id, name, description, amount, tax_id FROM ${tableName}`;
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

router.delete('/:id', async (request, response) => {
  const id = parseInt(request.params.id, 10);
  const queryString = `DELETE FROM ${tableName} WHERE id = $1`;
  const queryParams = [id];
  db.query(queryString, queryParams, (error, result) => {
    if (error) {
      return response.status(400).send(error);
    }
    if (result.rowCount < 1) {
      return response.status(404).send('Levy does not exist. Delete task is aborted.');
    }
    return response.status(200).send('Levy was successfully deleted.');
  });
});

router.post('/', async (request, response, next) => {
  const validationResult = validate(request.body);
  if (validationResult.error) {
    return next(response.status(400).send(validationResult.error.details[0].message));
  }
  Promise((resolve, reject) => {
    const {
      name, description, amount, tax_id
    } = request.body;
    const queryString = `INSERT INTO ${tableName}(name, description, amount, tax_id) VALUES ($1, $2, $3, $4)`;
    const queryParams = [name, description, amount, tax_id];
    db.query(queryString, queryParams, (error, result) => {
      if (error) {
        reject(response.status(400).send(error.detail));
      }
      resolve(result);
    }).then((result) => {
      // check if item was successfully added
      if (result.rowCount !== 1) {
        return response.status(400).send('Task aborted. Levy was not successfully created.');
      }
      const tQueryString = 'SELECT * FROM levies WHERE tax_id=$1';
      const tQueryParams = [tax_id];
      db.query(tQueryString, tQueryParams, (error, newResult) => {
        if (error) return response.status(400).send('Tax sum not computed. We could not get the related tax entity for this levy.');
        const taxLevies = newResult.rows;
        if (taxLevies.length > 0) {
          const taxAmount = taxLevies.map((m) => m.amount).reduce((prv, nxt) => prv + nxt);
          const nQueryString = 'UPDATE taxes SET total=$1 WHERE id=$2';
          const nQueryParams = [taxAmount, tax_id];
          db.query(nQueryString, nQueryParams, (nerror, nresult) => {
            if (nerror) return next(response.status(400).send(nerror));
            if (nresult.rowCount < 1) return response.status(404).send('Levies created, but parent Tax entity could not be updated.');
            return response.status(200).send('Levy successfully created.');
          });
        }
        return response.status(200).send('Levy successfully created.');
      });
      return response.status(200).send('Levy successfully created.');
    });
  });
  return response.status(200);
});

// router.post('/', async (request, response, next) => {
//   const validationResult = validate(request.body);
//   if (validationResult.error) {
//     return next(response.status(400).send(validationResult.error.details[0].message));
//   }
//   const {
//     // eslint-disable-next-line camelcase
//     name, description, amount, tax_id
//   } = request.body;
//   const queryString =
//    `INSERT INTO ${tableName}(name, description, amount, tax_id) VALUES ($1, $2, $3, $4)`;
//   // eslint-disable-next-line camelcase
//   const queryParams = [name, description, amount, tax_id];
//   return db.query(queryString, queryParams, (error, result) => {
//     if (error) {
//       return next(response.status(400).send(error.detail));
//     }
//     return response.status(200)
//      .send(`Levy created successfully. ${result.rowCount} item added.`);
//   });
// });

// router.put('/:id', async (request, response, next) => {
//   const validationResult = validate(request.body);
//   if (validationResult.error) {
//     return next(response.status(400).send(validationResult.error.details[0].message));
//   }
//   const {
//     name, description, amount
//   } = request.body;
//   const parsedId = parseInt(request.params.id, 10);
//   const parsedAmount = parseFloat(amount);
//   const queryString = `UPDATE ${tableName} SET name=$1, description=$2, amount=$3 WHERE id=$4`;
//   const queryParams = [name, description, parsedAmount, parsedId];
//   return db.query(queryString, queryParams, (error, result) => {
//     if (error) return next(response.status(400).send(error));
//     if (result.rowCount < 1)
//      return response.status(404).send(`Levy with ID ${request.params.id} does not exist.`);
//     return response.status(200).send('Levy successfully updated.');
//   });
// });

module.exports = router;
