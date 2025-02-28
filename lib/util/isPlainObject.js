/**
 * Determines if a value is a plain object.
 *
 * A plain object is an object created by the Object constructor or one with a null prototype.
 *
 * @param {*} value - The value to test.
 * @returns {boolean} True if the value is a plain object, false otherwise.
 */
function isPlainObject(value) {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}

export { isPlainObject }