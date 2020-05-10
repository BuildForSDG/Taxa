const Joi = require('joi');

const validate = (request) => {
  const schema = {
    user_Id: Joi.required(),
    role_Id: Joi.required()
  };
  return Joi.validate(request, schema);
};

exports.validate = validate;
