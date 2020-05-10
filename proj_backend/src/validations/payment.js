const Joi = require('joi');

const validate = (request) => {
  const schema = {
    tax_id: Joi.number().required(),
    user_id: Joi.string().required(),
    payment_channel_id: Joi.number().required(),
    amount: Joi.number().required()
  };
  return Joi.validate(request, schema);
};

exports.validate = validate;
