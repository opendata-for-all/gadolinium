// Warn if overriding existing method
if (Array.prototype.equals)
	console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
	// if the other array is a falsy value, return
	if (!array)
		return false;

	// compare lengths - can save a lot of time
	if (this.length != array.length)
		return false;

	for (var i = 0, l = this.length; i < l; i++) {
		// Check if we have nested arrays
		if (this[i] instanceof Array && array[i] instanceof Array) {
			// recurse into the nested arrays
			if (!this[i].equals(array[i]))
				return false;
		} else if (this[i] != array[i]) {
			// Warning - two different object instances will never be equal: {x:20} != {x:20}
			return false;
		}
	}
	return true;
};

Array.prototype.remove = function (item) {
	let index = this.indexOf(item);
	if(index > -1) this.splice(index, 1)
};

// // Hide method from for-in loops
// Object.defineProperty(Array.prototype, "equals", {enumerable: false});
//
// Object.prototype.equals = function (object2) {
// 	//For the first loop, we only check for types
// 	for (propName in this) {
// 		//Check for inherited methods and properties - like .equals itself
// 		//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwnProperty
// 		//Return false if the return value is different
// 		if (this.hasOwnProperty(propName) != object2.hasOwnProperty(propName)) {
// 			return false;
// 		}
// 		//Check instance type
// 		else if (typeof this[propName] != typeof object2[propName]) {
// 			//Different types => not equal
// 			return false;
// 		}
// 	}
// 	//Now a deeper check using other objects property names
// 	for (propName in object2) {
// 		//We must check instances anyway, there may be a property that only exists in object2
// 		//I wonder, if remembering the checked values from the first loop would be faster or not
// 		if (this.hasOwnProperty(propName) != object2.hasOwnProperty(propName)) {
// 			return false;
// 		} else if (typeof this[propName] != typeof object2[propName]) {
// 			return false;
// 		}
// 		//If the property is inherited, do not check any more (it must be equa if both objects inherit it)
// 		if (!this.hasOwnProperty(propName))
// 			continue;
//
// 		//Now the detail check and recursion
//
// 		//This returns the script back to the array comparing
// 		/**REQUIRES Array.equals**/
// 		if (this[propName] instanceof Array && object2[propName] instanceof Array) {
// 			// recurse into the nested arrays
// 			if (!this[propName].equals(object2[propName]))
// 				return false;
// 		} else if (this[propName] instanceof Object && object2[propName] instanceof Object) {
// 			// recurse into another objects
// 			//console.log("Recursing to compare ", this[propName],"with",object2[propName], " both named \""+propName+"\"");
// 			if (!this[propName].equals(object2[propName]))
// 				return false;
// 		}
// 		//Normal value comparison for strings and numbers
// 		else if (this[propName] != object2[propName]) {
// 			return false;
// 		}
// 	}
// 	//If everything passed, let's say YES
// 	return true;
// }

var isEqual = function (value, other) {

	// Get the value type
	var type = Object.prototype.toString.call(value);

	// If the two objects are not the same type, return false
	if (type !== Object.prototype.toString.call(other)) return false;

	// If items are not an object or array, return false
	if (['[object Array]', '[object Object]'].indexOf(type) < 0) return false;

	// Compare the length of the length of the two items
	var valueLen = type === '[object Array]' ? value.length : Object.keys(value).length;
	var otherLen = type === '[object Array]' ? other.length : Object.keys(other).length;
	if (valueLen !== otherLen) return false;

	// Compare two items
	var compare = function (item1, item2) {

		// Get the object type
		var itemType = Object.prototype.toString.call(item1);

		// If an object or array, compare recursively
		if (['[object Array]', '[object Object]'].indexOf(itemType) >= 0) {
			if (!isEqual(item1, item2)) return false;
		}

		// Otherwise, do a simple comparison
		else {

			// If the two items are not the same type, return false
			if (itemType !== Object.prototype.toString.call(item2)) return false;

			// Else if it's a function, convert to a string and compare
			// Otherwise, just compare
			if (itemType === '[object Function]') {
				if (item1.toString() !== item2.toString()) return false;
			} else {
				if (item1 !== item2) return false;
			}

		}
	};

	// Compare properties
	if (type === '[object Array]') {
		for (var i = 0; i < valueLen; i++) {
			if (compare(value[i], other[i]) === false) return false;
		}
	} else {
		for (var key in value) {
			if (value.hasOwnProperty(key)) {
				if (compare(value[key], other[key]) === false) return false;
			}
		}
	}

	// If nothing failed, return true
	return true;

};