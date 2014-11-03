var util = require('./utils/util');

module.exports = Module;

function Module(router, name, moduleObj){
  this.router = router;
  this.name = name;
  router.modules[name] = this;

  this._addFunctions(moduleObj);
}

Module.prototype._addFunctions = function(moduleObj){
  var self = this;
  this.load = moduleObj.load;
  this.setup = moduleObj.setup;

  this.deps = {
    load: util.getDependency(this.load),
    setup: util.getDependency(this.setup)
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

// dumb functions
Module.prototype.load = function(){};
Module.prototype.setup = function(){};
