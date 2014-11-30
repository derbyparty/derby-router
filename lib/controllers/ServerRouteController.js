var errors = require('./../utils/errors');
var util = require('./../utils/util');
var each = require('async-each-series');

module.exports = ServerRouteController;

function ServerRouteController(route, req, res, next){

  // get rid of new
  if (!(this instanceof ServerRouteController)){
    var obj = Object.create(ServerRouteController.prototype);
    obj.constructor.apply(obj, arguments);
    return obj;
  }

  this._route = route;
  this._router = route.router;
  this._next = next;

  this.req = req;
  this.res = res;
  this.app = route.router.app;
  this.params = util.getPageParams(req);
  this.model = req.getModel();
  this.name = route.opts.name;
  this.path = route.opts.path;

  this._doAction();
}

ServerRouteController.prototype.redirect = function(name, options){
  var args = Array.prototype.slice.call(arguments);
  var router = this._router;
  var path = router.pathFor.apply(router, args);

  this.res.redirect(path);
};


ServerRouteController.prototype.next = function(err){
  this._next(err);
};

ServerRouteController.prototype._doAction = function(){

  var self = this;
  var fns = this._route.opts.fns;

  each(fns, function(fn, callback){

    if (util.isFunction(fn)) {
      function cb(err){
        if (err) {
          return self.next(err);
        }
        callback();
      }

      var context = Object.create(self, {next: {value: cb}});
      fn.call(context, self.req, self.res, context.next);
    } else {
      // TODO fix error message
      throw new Error(errors['fnOrArray']);
    }
  }, function(){
    self.next();
  });
};
