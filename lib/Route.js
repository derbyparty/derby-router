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

  router.routes[this.opts.name] = this;
  router.app['_' + this.opts.method](this.opts.path, this.action.bind(this));

  this._parseParams();
}

Route.prototype.action = function(page, model, params, next){
  new this.opts.controller(this, page, model, params, next);
};

Route.prototype._parseParams = function(){
  this.params = [];
};


Route.prototype.getParams = function(){
  return this.params;
};

