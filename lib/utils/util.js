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

exports.isPlainObject = function (o) {
  return !!o && typeof o === 'object' && o.constructor === Object;
};


exports.nameToPath = function (str) {
  return '/' + str.replace('.', '/');
};

exports.pathToName = function (str) {
  var res;

  if (str === '/') {
    return 'home';
  }

  res = str.replace('/', '.');
  var pos = res.indexOf(':');
  if (pos !== -1) {
    res = res.split(':')[0];
  }
  res = res.replace(/^\.|\.$/g, '');

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