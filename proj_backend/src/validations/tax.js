const Joi = require('joi');

const validate = (request) => {
  const schema = {
    name: Joi.string().min(1).max(150).required(),
    description: Joi.string(),
    total: Joi.number(),
    localGovernmentId: Joi.number().required()
  };
  return Joi.validate(request, schema);
};

exports = validate;
