/**
 * EconomyError class.
 */
class EconomyError extends Error {
    /**
     * Creates an 'EconomyError' error instance.
     * @param {String | Error} message Error message.
     */
    constructor(message) {
        if (message instanceof Error == 'Error') {
            super(message.message)
            Error.captureStackTrace(this, this.constructor)
        }
        if (typeof message == 'string') super(message)
        /**
         * Error name.
         * @type {string}
         */
        this.name = 'EconomyError'
    }
}
module.exports = EconomyError