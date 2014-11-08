exports.toQueryString = function (queryObject) {
  var result = [];

  if (typeof queryObject === 'string') {
    if (queryObject.charAt(0) !== '?') {
      return '?' + queryObject;
    } else {
      return queryObject;
    }
  }

  for(var key in queryObject){
    var value = queryObject[key];
    if (Array.isArray(value)) {
      value.forEach(function(valuePart) {
        result.push(encodeURIComponent(key + '[]') + '=' + encodeURIComponent(valuePart));
      });
    } else {
      result.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
    }
  }

  // no sense in adding a pointless question mark
  if (result.length > 0) return '?' + result.join('&');

  return '';
};