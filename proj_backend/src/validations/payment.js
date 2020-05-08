const Joi = require('joi');

const validate = (request) => {
  const schema = {
    taxId: Joi.number().required(),
    userId: Joi.string().required(),
    paymentChannelId: Joi.number().required(),
    amount: Joi.number().required()
  };
  return Joi.validate(request, schema);
};

exports = validate;
