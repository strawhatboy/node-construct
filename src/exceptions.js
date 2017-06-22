class BaseException extends Error {
    constructor(msg, name) {
        super(msg)

        // babel stupid bug, this.constructor.name will return super class' name but not THIS!
        // another STUPID thing is: the subclasses are still instanceof 'Error', just like the Array object.
        console.log('INIT Exception with name: ' + name)
        this.name = name
    }
}

export class OutOfRangeException extends BaseException { constructor(msg) { super(msg, 'OutOfRangeException') } }
export class ParseException extends BaseException { constructor(msg) { super(msg, 'ParseException') } }
export class ValidationException extends BaseException { constructor(msg) { super(msg, 'ValidationException') } }