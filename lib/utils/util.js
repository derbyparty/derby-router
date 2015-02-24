var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;


exports.isPath = function (str){
  return str.charAt(0) === '/'
};

exports.isPlainObject = function (o) {
  return !!o && typeof o === 'object' && o.constructor === Object;
};

exports.isFunction = function (o) {
  return typeof o === 'function';
};

exports.isArray = function (o) {
  return Array.isArray(o);
};

exports.isString = function (o) {
  return typeof o === "string";
};

exports.isNumber = function (n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

exports.capitalize = function(s){
  return s.charAt(0).toUpperCase() + s.substring(1);
};


exports.nameToPath = function (str) {
  return '/' + str.replace(':', '/');
};

exports.pathToName = function (str) {
  var res;

  if (str === '/') {
    return 'home';
  }

  res = str.replace(':', '');

  res = res.replace('/', ':');

  // remove starting and ending ':'

  res = res.replace(/^\:|\:$/g, '');

  return res;
};

exports.extend = function(dest, source) {
  source = source || {};
  for(var key in source) {
    if(source.hasOwnProperty(key)) {
      dest[key] = source[key];
    }
  }
  return dest;
};


exports.getDependency = function(fn){
  var res = fn.toString().match(FN_ARGS)[1].split(',');

  res = res.map(function(module){
    return module.trim();
  });

  if (res.length === 1 && res[0] === '') return [];

  return res;
};

exports.mixArrays = function(){
  return Array.prototype.concat.apply([], arguments).filter(function(item, index, arr){
    return arr.indexOf(item) === index;
  });
};

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

exports.getPageParams = function(req) {
  var reqParams = req.params;
  var params = {
    url: req.url
    , body: req.body
    , query: req.query
  };
  for (var key in reqParams) {
    params[key] = reqParams[key]
  }
  return params
};

exports.pushToArray = function(dst, src){
  Array.prototype.push.apply(dst, src);
};