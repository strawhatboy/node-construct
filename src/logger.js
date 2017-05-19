import log4js from 'log4js'

class LogFactory {
    constructor() {
        log4js.configure({
            appenders: [
                {
                    type: 'console'
                }
            ],
            levels: {
                '[all]': 'INFO'
            }
        })
    }

    getLogger() {
        return log4js.getLogger.apply(log4js, arguments)
    }
}

export let logFactory = new LogFactory()
