var errors = require('./../utils/errors');
var util = require('./../utils/util');
var each = require('async-each-series');

module.exports = ServerRouteInstance;

function ServerRouteInstance(route, req, res, next){
  this._route = route;
  this._router = route.router;
  this.req = req;
  this.res = res;
  this.app = route.router.app;
  this.params = util.getPageParams(req);
  this.model = req.getModel();
  this._next = next;
  this.name = route.opts.name;
  this.path = route.opts.path;
  this._doAction();
}

ServerRouteInstance.prototype.next = function(err){
  this._next(err);
};

ServerRouteInstance.prototype._doAction = function(){

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
