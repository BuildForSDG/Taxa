const Joi = require('joi');

const validate = (request) => {
  const schema = {
    name: Joi.string().min(1).max(150).required(),
    description: Joi.string(),
    amount: Joi.number().required(),
    tax_id: Joi.number().required()
  };
  return Joi.validate(request, schema);
};

const validateDelete = (request) => {
  const scheme = {
    tax_id: Joi.number().required()
  };
  return Joi.validate(request, scheme);
};

exports.validate = validate;
exports.validateDelete = validateDelete;
