const jwt = require('jsonwebtoken');
const { jwtPrivateKey } = require('../../config');

const auth = (request, response, next) => {
  const token = request.header('x-auth-token');
  if (!token) return response.status(401).send('Access denied. Please provide a valid token.');
  try {
    const decoded = jwt.verify(token, jwtPrivateKey);
    request.user = decoded;
    next();
    return response.status(200).send('Access granted.');
  } catch (ex) {
    return response.status(400).send('Access denied. Invalid Token.');
  }
};

module.exports = auth;
