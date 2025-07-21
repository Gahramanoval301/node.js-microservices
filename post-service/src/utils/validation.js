const Joi = require("joi")

const validateCreatePost = (data) =>{
    const schema = Joi.object({
        content:Joi.string().min(3).max(500).required()
    })

    return schema.validate(data);
}


// const validationLogin = (data) =>{
//     const schema = Joi.object({
//         email:Joi.string().email().required(),
//         password: Joi.string().min(6).required()
//     })

//     return schema.validate(data);
// }

module.exports = {validateCreatePost};