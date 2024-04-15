const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);


const loginValidator = (data) => {
  const schema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  });
  return schema.validate(data);
};


const productValidator = (data) => {
  const schema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().required(),
    previous_price: Joi.number().required(),
  });
  return schema.validate(data);
};


module.exports = { loginValidator, productValidator };
