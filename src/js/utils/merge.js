/**
 * Merges two or more objects into a single object. It either overrides if the key is the same, or appends to the existing object.
 * The first parameter is the destination, all the other parameters are the sources.
 * The level of importance increases starting from the destination to the last source (the last source will be the most important).
 *
 * @param  {object} destination The object to which the source objects will be merged
 * @param  {object} source Any number of further arguments which are sources and will be merged to the destination.
 * @return {object} The modified destination object with the sources merged in.
 */
function merge (destination) {
	const ln = arguments.length;
	const mergeFn = merge;
	let object;
	let key;
	let value;

	for (let i = 1; i < ln; i++) {
		object = arguments[i];

		for (key in object) {
			if (object.hasOwnProperty(key)) {
				value = object[key];

				if (value !== null && typeof value !== 'undefined') {
					if (typeof destination[key] === 'undefined') {
						destination[key] = value;
					} else if (destination[key].constructor !== Object) {
						destination[key] = value;
					} else {
						if (value.constructor !== Object) {
							destination[key] = value;
						} else {
							mergeFn(destination[key], value);
						}
					}
				}
			}
		}
	}

	return destination;
}
module.exports = merge;
