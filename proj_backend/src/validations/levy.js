const Joi = require('joi');

const validate = (request) => {
  const schema = {
    name: Joi.string().min(1).max(150).required(),
    description: Joi.string(),
    amount: Joi.string().min(1).max(150).required(),
    tax_id: Joi.number().required()
  };
  return Joi.validate(request, schema);
};

exports.validate = validate;
