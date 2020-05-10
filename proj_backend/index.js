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
app.get('/', (_request, response) => { response.send(serverStatus); });
const urlPrepend = '/api/v1';

const roles = require('./src/routes/roles');
const states = require('./src/routes/states');
const localGovernments = require('./src/routes/localGovernments');
const levies = require('./src/routes/levies');
const paymentChannels = require('./src/routes/paymentChannels');
const payments = require('./src/routes/payments');
const taxes = require('./src/routes/taxes');
const userRoles = require('./src/routes/userRoles');
const users = require('./src/routes/users');
const auth = require('./src/routes/auth');

app.use(`${urlPrepend}/roles`, roles);
app.use(`${urlPrepend}/states`, states);
app.use(`${urlPrepend}/localGovernments`, localGovernments);
app.use(`${urlPrepend}/levies`, levies);
app.use(`${urlPrepend}/paymentChannels`, paymentChannels);
app.use(`${urlPrepend}/payments`, payments);
app.use(`${urlPrepend}/taxes`, taxes);
app.use(`${urlPrepend}/userRoles`, userRoles);
app.use(`${urlPrepend}/users`, users);
app.use(`${urlPrepend}/auth`, auth);

//  Error 404 - Resource not found handler
app.use((_request, response) => {
  response.status(404).send('Sorry, The resource you requested was not found.');
});
