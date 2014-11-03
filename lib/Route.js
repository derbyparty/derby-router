var util = require('./utils/util');
var RouteController = require('./RouteController');

module.exports = Route;

function Route(router, opts){
  var defaultOptions = {
    controller: RouteController,
    method: 'get'
  };

  this.router = router;
  this.opts = util.extend(defaultOptions, opts);

  router.routes[this.opts.name] = this;
  router.app.get(this.opts.path, this.action.bind(this));
}

Route.prototype.action = function(page, model, params, next){
//  console.log('route action', params, this.opts);
  new this.opts.controller(this, page, model, params, next);
};