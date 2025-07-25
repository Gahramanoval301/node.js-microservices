const Joi = require("joi")

const validateCreatePost = (data) =>{
    const schema = Joi.object({
        content:Joi.string().min(3).max(500).required(),
        mediaIds:Joi.array()
        // .items(Joi.string()).required()
    })

    return schema.validate(data);
}

module.exports = {validateCreatePost};