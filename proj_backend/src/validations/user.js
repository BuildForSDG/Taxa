const Joi = require('joi');
// const PasswordComplexity = require('joi-password-complexity');

// const complexityOptions = {
//   min: 6,
//   max: 20,
//   lowerCase: 1,
//   upperCase: 1,
//   numeric: 1,
//   symbol: 1,
//   requirementCount: 2
// };

const validate = (request) => {
  const schema = {
    email: Joi.string().email().required().min(5)
      .max(255)
      .trim(),
    business_name: Joi.string().required().min(5)
      .max(255)
      .trim(),
    phone_number: Joi.string().min(5).max(50).required()
      .trim(),
    // password: new PasswordComplexity(complexityOptions).required(),
    last_name: Joi.string().min(3).max(50).trim(),
    first_name: Joi.string().min(3).max(50).trim(),
    address: Joi.string().min(5).max(150).trim(),
    local_government_id: Joi.number().required(),
    is_government_official: Joi.boolean(),
    designation: Joi.string().min(0).max(100).trim()
  };
  return Joi.validate(request, schema);
};

exports.validate = validate;
