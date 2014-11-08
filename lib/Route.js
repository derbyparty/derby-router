var pathToRegexp = require('path-to-regexp');
var url = require('./utils/url');
var util = require('./utils/util');
var RouteInstance = require('./RouteInstance');

module.exports = Route;

function Route(router, opts){
  var defaultOptions = {
    controller: RouteInstance
  };

  this.router = router;
  this.opts = util.extend(defaultOptions, opts);
  this.params = [];
  this.name = this.opts.name;
  this.path = this.opts.path;
  this.regexp = pathToRegexp(this.opts.path, this.params);

  router.routes[this.opts.name] = this;
  router.app['_' + this.opts.method](this.regexp, this.action.bind(this));

}

Route.prototype.action = function(page, model, params, next){
  new this.opts.controller(this, page, model, params, next);
};

//Route.prototype._parseParams = function(){
//  this.params = [];
//};


Route.prototype.getParams = function(){
  return this.params;
};

// Из опций берется только:
// query и hash - остальное из params
//
// В params как именованые так и нумерованные параметры:
// например:
// /:param/:par    {param: '', par: ''}
// /:param/(.*)
//Route.prototype.resolve = function (params, options) {
//
//  var value;
//  var isValueDefined;
//  var result;
//  var wildCardCount = 0;
//  var path = this.path;
//  var hash;
//  var query;
//  var missingParams = [];
//  var originalParams = params;
//
//  options = options || {};
//  params = params || [];
//  query = options.query;
//  hash = options.hash && options.hash.toString();
//
//  if (path instanceof RegExp) {
//    throw new Error('Cannot currently resolve a regular expression path');
//  } else {
//    // slash -   / - опционально
//    // format    . - опционально
//    // key -     :name
//    // capture - (all) -   шаблон   (?:x) Находит x, но не запоминает найденное.
//    // optional- ? - опционально
//
//    // /.:name(all)? - общий вид
//    path = path.replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function (match, slash, format, key, capture, optional, offset) {
//      slash = slash || '';
//      value = params[key];
//      isValueDefined = typeof value !== 'undefined';
//
//      if (optional && !isValueDefined) {
//        value = '';
//      } else if (!isValueDefined) {
//        missingParams.push(key);
//        return;
//      }
//
//      value = util.isFunction(value) ? value.call(params) : value;
//
//      var escapedValue = String(value).split('/').map(function (segment) {
//        return encodeURIComponent(segment);
//      }).join('/');
//      return slash + escapedValue
//
//    }).replace(/\*/g, function (match) {
//      if (typeof params[wildCardCount] === 'undefined') {
//        throw new Error('You are trying to access a wild card parameter at index ' + wildCardCount + ' but the value of params at that index is undefined');
//      }
//
//      var paramValue = String(params[wildCardCount++]);
//      return paramValue.split('/').map(function (segment) {
//        return encodeURIComponent(segment);
//      }).join('/');
//    });
//
//    query = url.toQueryString(query);
//
//    path = path + query;
//
//    if (hash) {
//      hash = encodeURI(hash.replace('#', ''));
//      path = query ? path + '#' + hash : path + '/#' + hash;
//    }
//  }
//
//  // Because of optional possibly empty segments we normalize path here
//  path = path.replace(/\/+/g, '/'); // Multiple / -> one /
//  path = path.replace(/^(.+)\/$/g, '$1'); // Removal of trailing /
//
//  if (missingParams.length == 0)
//    return path;
//  else if (options.throwOnMissingParams === true)
//    throw new Error("Missing required parameters on path " + JSON.stringify(this._originalPath) + ". The missing params are: " + JSON.stringify(missingParams) + ". The params object passed in was: " + JSON.stringify(originalParams) + ".");
//  else
//    return null;
//};

Route.prototype.resolve = function () {
  var args = Array.prototype.slice.call(arguments);
  var self = this;
  var options = {};

  if (args.length > 0 && util.isPlainObject(args[args.length - 1])) {
    options = args.pop();
  }

  // setup options if there are additional arguments
  // f.e route.resolve('main', '100', {$hash: 'header'})
  if (args.length > 0) {
    // [ { name: 'id', delimiter: '/', optional: false, repeat: false } ]
    var i = 0, exit = false;

    while(i < args.length && !exit) {
      var param = this.params[i];
      options[param.name] = args[i];
//      if(param.optional) exit = true;
      i++;
    }
  }


  var path = this.path;
  var query = options.$query;
  var hash  = options.$hash;

  var groupCount = 0;

  // the regexp is from there - https://github.com/pillarjs/path-to-regexp/blob/master/index.js#L23
  // To analize it use - http://regex101.com/#javascript
  var PATH_REGEXP = new RegExp('([\\/.])?(?:\\:(\\w+)(?:\\(((?:\\\\.|[^)])*)\\))?|\\(((?:\\\\.|[^)])*)\\))([+*?])?', 'g');

  // prefix - / or .
  // key    - :param - named parameter
  // capture- (...) - optional regexp inside parents  - after param
  // group  - (.*) - unnamed parameter
  // suffix - ? or * or +
  //
  // schema = prefix? ( (key capture) | (group) ) suffix?
  path = path.replace(PATH_REGEXP, function(match, prefix, key, capture, group, suffix){
    // named param
    if (!key){
      key = groupCount++;
    }

    var value = options[key];

    if (util.isFunction(value)) value = value.call(self, options);

    switch (suffix){
      case ('+'): return fillParam(false, true);
      case ('?'): return fillParam(true, false);
      case ('*'): return fillParam(true, true);
      default:    return fillParam(false, false);
    }

    function fillParam(optional, repeat){
      if (!value){

        if (optional) return '';
        throw Error('Cant find param: ' + key);

      } else if (util.isString(value) || util.isNumber(value)) {

        return prefix + String(value);

      } else if (util.isArray(value)) {

        if (!repeat) {
          throw Error('Should not be an array: ' + key);
        }
        return prefix + value.join(prefix);

      }
    }
  });

  query = url.toQueryString(query);

  path = path + query;

  if (hash) {
    hash = encodeURI(hash.replace('#', ''));
    path += (query ? '#':  '/#') + hash;
  }

  return path;
};