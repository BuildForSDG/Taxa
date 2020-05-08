const Joi = require('joi');

const validate = (request) => {
  const schema = {
    userId: Joi.required(),
    roleId: Joi.required()
  };
  return Joi.validate(request, schema);
};

exports.validate = validate;
