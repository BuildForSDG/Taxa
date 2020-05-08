const Joi = require('joi');

const validate = (request) => {
  const schema = {
    name: Joi.string().min(3).max(50).required()
  };
  return Joi.valid(request, schema);
};

exports = validate;
