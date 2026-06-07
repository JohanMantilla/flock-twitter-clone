import Joi from "joi";

export const envSchema = Joi.object({
    PORT: Joi.number().default(3000)
})