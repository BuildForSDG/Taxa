const Joi = require('joi');

const validate = (request) => {
  const schema = {
    userId: Joi.required(),
    roleId: Joi.required()
  };
  return Joi.valid(request, schema);
};

exports = validate;
