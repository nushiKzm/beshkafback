const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const validateCreateUser = (data) => {
  const schema = Joi.object({
    // name: Joi.string().required(),
    username: Joi.string().required(),
    password: Joi.string(),
  });
  return schema.validate(data);
};
const validateLoginUser = (data) => {
  const schema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string(),
  });
  return schema.validate(data);
};


module.exports = { validateCreateUser, validateLoginUser };
