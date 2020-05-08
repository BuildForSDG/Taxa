/* eslint-disable no-unused-vars */
const express = require('express');
const uuidv1 = require('uuid/v1');
const db = require('../db');

const router = express.Router();
const tableName = 'users';

router.get('/', async (_request, response) => {
  const queryString = `SELECT id, uniqueId, firstName, lastName, email, phoneNumber, businessName, lastLogin, isEnabled, address, localGovernmentId, isGovernmentOfficial, designation, createdon FROM ${tableName}`;
  const queryParams = [];
  db.query(queryString, queryParams, (error, res) => {
    if (error) { return response.status(400).send(error); }
    return response.send(res.rows);
  });
});
