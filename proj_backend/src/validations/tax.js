const Joi = require('joi');

const validate = (request) => {
  const schema = {
    name: Joi.string().min(1).max(150).required(),
    description: Joi.string(),
    local_government_id: Joi.number().required()
  };
  return Joi.validate(request, schema);
};

const validatePut = (request) => {
  const scheme = {
    name: Joi.string().min(1).max(150).required(),
    description: Joi.string()
  };
  return Joi.validate(request, scheme);
};

exports.validate = validate;
exports.validatePut = validatePut;
