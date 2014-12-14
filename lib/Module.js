var util = require('./utils/util');

module.exports = Module;

function Module(router, name, moduleObj){

  // get rid of new
  if (!(this instanceof Module)){
    var obj = Object.create(Module.prototype);
    obj.constructor.apply(obj, arguments);
    return obj;
  }

  this.router = router;
  this.name = name;
  router.modules[name] = this;

  this._addFunctions(moduleObj);
}

Module.prototype._addFunctions = function(moduleObj){
  var self = this;

//  if (util.isFunction(moduleObj) || util.isArray(moduleObj)){
//    moduleObj = {
//      load: moduleObj,
//    }
//  }

  moduleObj.load = moduleObj.load || function(){};
  moduleObj.setup = moduleObj.setup || function(){};
  this.load = this._extractFn('load', moduleObj.load);
  this.setup = this._extractFn('setup', moduleObj.setup);


  this.deps = {
    load: this._extractDeps('load', moduleObj.load),
    setup: this._extractDeps('setup', moduleObj.setup)
  };

  this.deps.all = util.mixArrays(this.deps.load, this.deps.setup);

  this.deps.all.forEach(function(moduleName){
    if (moduleName === self.name) {
      throw Error('Recursive module dependency: ' + moduleName);
    }
  });

//  console.log('deps', this.name, this.deps);
};

Module.prototype.getDeps = function(name){
  name = name || 'all';
  return this.deps[name];
};

Module.prototype._extractDeps = function(name, fn){
  if (util.isFunction(fn)) return util.getDependency(fn);
  if (util.isArray(fn)){
    // TODO check num of params and array length
    // TODO check if last-param is function
    // last param is function
    return fn.slice(0, fn.length - 1);
  }

  throw Error('function: ' + name + ' in module: ' + this.name + ' should be a function or an array!')
};

Module.prototype._extractFn = function(name, fn){
  if (util.isFunction(fn)) return fn;
  if (util.isArray(fn)){
    // TODO check num of paarams and array length
    // TODO check if last-param is function
    // last param is function
    return fn[fn.length - 1];
  }

  throw Error('function: ' + name + ' in module: ' + this.name + ' should be a function or an array!')
};


// dumb functions
Module.prototype.load = function(){};
Module.prototype.setup = function(){};
