const winston = require("winston")

const logger = winston.createLogger({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    //how we are doing format the messages and we combine something..
    format:winston.format.combine(
        //add timestamp when we are login our files
        winston.format.timestamp(),
        //if there is error, format
        winston.format.errors({stack:true}),
        //splat enables support for message templating 
        winston.format.splat(),
        //fromatting in json format 
        winston.format.json()
    ),
    //metadata which service we are using 
    defaultMeta: {service:"media-service"},
    // this will specify output destination for our logs
    transports:[
        //make output in console in colorized and simple format
        new winston.transports.Console({
            format:winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        //make output in files (2 different 1 for only errors 2 for all types) 
        new winston.transports.File({filename:'error.log', level:"error"}),
        new winston.transports.File({filename:'combined.log'}),
    ]
})

module.exports = logger;