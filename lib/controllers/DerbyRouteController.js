var errors = require('./../utils/errors');
var util = require('./../utils/util');
var each = require('async-each-series');

module.exports = DerbyRouteInstance;

function DerbyRouteInstance(route, page, model, params, next){
  this._route = route;
  this._router = route.router;
  this.app = route.router.app;
  this.page = page;
  this.model = model;
  this.params = params;
  this.path = route.opts.path;
  this._next = next;
  this.name = route.opts.name;
  this._moduleInstances = {};
  this._subscriptions = [];
  this._loadedModules = [];
  this._doAction();
}

DerbyRouteInstance.prototype.addSubscription = function(subscription){
  this._subscriptions.push(subscription);
};

DerbyRouteInstance.prototype.render = function(name){
  name = name || this.name;

  this.page.render.call(this.page, name);
};

DerbyRouteInstance.prototype.next = function(err){
  this._clean();
  this._next(err);
};

DerbyRouteInstance.prototype._clean = function(){
  this._subscriptions = [];
  this._moduleInstances = {};
  this._loadedModules = [];
};


DerbyRouteInstance.prototype._doAction = function(){
//  console.log('DerbyRouteController.prototype._doAction start', this.params, this._route);
  var self = this;
  var fns = this._route.opts.fns;

  each(fns, function(fn, callback){

    self._clean();

    if (util.isFunction(fn)) {
      function cb(err){
        if (err) return self.next(err);
        callback();
      }

      var context = Object.create(self, {next: {value: cb}});
      fn.call(context, self.page, self.model, self.params, context.next);

    } else if (util.isArray(fn)){
      var deps = self._resolveDeps(fn);

//      console.log('deps', deps);

      each(deps, self._commonAction.bind(self), callback);

    } else {
      throw new Error(errors['fnOrArray']);
    }
  }, function(){

    self._clean();

    if ((fns.length === 0 || util.isArray(fns[fns.length -1])) && !self._route.opts.dontRender){
      self.render();
    } else {
      self.next();
    }
  });

};

DerbyRouteInstance.prototype._commonAction = function(modules, cb){
//  console.log('commonAction', modules);
  this.loadModules.apply(this, modules);
  this.setupModules(cb);
};

DerbyRouteInstance.prototype.loadModules = function(){
  var modules = Array.prototype.slice.call(arguments);
  modules.forEach(this._loadModule.bind(this));
};

DerbyRouteInstance.prototype._loadModule = function(name){

  var module = this._router.modules[name];

  if (!module) return this.next(Error('Unregistered module: '+ name));

  var params = this._getModuleParams(name, 'load');

  var moduleInstance = Object.create(this);

  module.load.apply(moduleInstance, params);

  this._moduleInstances[name] = moduleInstance;
  this._loadedModules.push(name);
};

DerbyRouteInstance.prototype.setupModules = function(cb){
  var self = this;

  self.model.subscribe(this._subscriptions, function(err){
    if (err) return self.next(err);

    self._loadedModules.forEach(function(name){
      var module = self._router.modules[name];

      if (!module) return self.next(Error('Unregistered module: '+ name));

      var moduleInstance = self._moduleInstances[name];
      var params = self._getModuleParams(name, 'setup');
      module.setup.apply(moduleInstance, params);
    });

    self._loadedModules = [];

    cb.call(self);
  });
};

DerbyRouteInstance.prototype._getModuleParams = function(name, type){
  var self = this;

  var module = this._router.modules[name];

  if (!module) return this.next(Error('Unregistered module: '+ name));

  var params = module.getDeps(type).map(function(moduleName){
    return self._moduleInstances[moduleName];
  });

  return params;
};


DerbyRouteInstance.prototype._resolveDeps = function(fn){
  var deps = [];

  var moduleHash = {}, resolvedHash = {};
  var modules = this._router.modules;

  // Get ALL dependencies recursively
  function deeper(moduleHash, deps){
    deps.forEach(function(moduleName){
      if (!(moduleName in moduleHash)){
        moduleHash[moduleName] = true;
        var module = modules[moduleName];

        if (!module) {
//          console.log('List of registered modules: ', Object.keys(modules).join(', '));
          throw Error('Cant find module: "' + moduleName+'"');
        }
        deeper(moduleHash, module.getDeps());
      }
    });
  }

  deeper(moduleHash, fn);

  // Split dependency into levels

  while (Object.keys(moduleHash).length !== 0) {
    deps.push(getResolvedDeps(moduleHash, resolvedHash))
  }

  function getResolvedDeps(queuedModuses, resolvedModules){
    var generation = Object.keys(queuedModuses).filter(function(module){
      var deps = modules[module].getDeps();
      var result = deps.reduce(function(acc, module){
        return (module in resolvedModules) && acc;
      }, true);

      return result;
    });

    generation.forEach(function(moduleName){
      delete queuedModuses[moduleName];
      resolvedModules[moduleName] = true;
    });

    return generation;
  }

  return deps;

};

