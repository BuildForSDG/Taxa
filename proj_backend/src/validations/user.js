const Joi = require('joi');
const PasswordComplexity = require('joi-password-complexity');

const complexityOptions = {
  min: 6,
  max: 20,
  lowerCase: 1,
  upperCase: 1,
  numeric: 1,
  symbol: 1,
  requirementCount: 2
};

const validate = (request) => {
  const schema = {
    email: Joi.string().email().required().min(5)
      .max(255)
      .trim(),
    businessName: Joi.string().email().required().min(5)
      .max(255)
      .trim(),
    phoneNumber: Joi.string().min(5).max(50).required()
      .trim(),
    password: new PasswordComplexity(complexityOptions).required(),
    lastName: Joi.string().min(3).max(50).trim(),
    firstName: Joi.string().min(3).max(50).trim(),
    address: Joi.string().min(5).max(150).trim(),
    localGovernmentId: Joi.number().required()
  };
  return Joi.validate(request, schema);
};

exports = validate;
