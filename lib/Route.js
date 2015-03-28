var pathToRegexp = require('path-to-regexp');
var util = require('./utils/util');

var DerbyRouteController = require('./controllers/DerbyRouteController');
var ServerRouteController = require('./controllers/ServerRouteController');

module.exports = Route;

function Route(router, opts){

  // get rid of new
  if (!(this instanceof Route)){
    var obj = Object.create(Route.prototype);
    obj.constructor.apply(obj, arguments);
    return obj;
  }

  var defaultOptions = {
    derbyController: DerbyRouteController,
    serverController: ServerRouteController
  };

  this.router = router;
  this.opts = util.extend(defaultOptions, opts);
  this.params = [];
  this.name = this.opts.name;
  this.path = this.opts.path;
  this.regexp = pathToRegexp(this.opts.path, this.params);

  router.routes[this.opts.name] = this;

  if (this.opts.type === 'derby') {
    router.app['_' + this.opts.method](this.regexp, this.derbyAction.bind(this));
  }
}

Route.prototype.derbyAction = function(page, model, params, next){
  // Name pamams
  var keys = this.regexp.keys || [];
  for(var index = 0; index < keys.length; index ++){
    var key = keys[index];
    params[key.name] = params[index];
    delete params[index]
  }

  this.opts.derbyController(this, page, model, params, next);
};

Route.prototype.serverAction = function(req, res, next){
  this.opts.serverController(this, req, res, next);
};

Route.prototype.getParams = function(){
  return this.params;
};

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

  if (path instanceof RegExp) {
    throw new Error('Cannot currently resolve a regular expression path');
  }

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

  query = util.toQueryString(query);

  path = path + query;

  if (hash) {
    hash = encodeURI(hash.replace('#', ''));
    path += (query ? '#':  '/#') + hash;
  }

  return path;
};