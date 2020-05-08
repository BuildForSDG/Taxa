const cors = require('cors');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const express = require('express');

//  App
const app = express();
const PORT = process.env.PORT || 3010;
app.listen(PORT);

//  Middlewares
app.use(cors({
  origin: '*',
  exposedHeaders: ['x-auth-token']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//  Routes
const serverStatus = { 'server name': 'Team 104 Product backend', status: 'live' };
app.get('/', (_request, response) => {
  response.send(serverStatus);
});
const urlPrepend = '/api/v1';

const roles = require('./src/routes/roles');

app.use(`${urlPrepend}/roles`, roles);
// app.use('/api/v1/roles', roles);

//  Error 404 - Resource not found handler
app.use((_request, response) => {
  response.status(404).send('Sorry, The resource you requested was not found.');
});
