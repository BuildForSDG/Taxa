/* eslint-disable no-unused-vars */
const express = require('express');
const db = require('../db');

const router = express.Router();
const tableName = 'taxes';

router.get('/', async (_request, response) => {
  const queryString = `SELECT * FROM ${tableName}`;
  const queryParams = [];
  db.query(queryString, queryParams, (error, result) => {
    if (error) { return response.status(400).send(error); }
    return response.send(result.row);
  });
});
