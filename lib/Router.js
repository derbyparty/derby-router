var derby = require('derby');
var Route = require('./Route');
var Module = require('./Module');

var options = require('./utils/options');
var methods = ['get', 'post', 'put', 'del'];

function Router(app, options){
  var self = this;

  self.options = options || {};

  self.app = app;

  self.routes = {};
  self.modules = {};

  methods.forEach(function(method){
    app['_'+method] = app[method];
    app[method] = self.route.bind(self, method);
  });

  app.module = self.module.bind(self);
  app.proto.pathFor = self.pathFor.bind(self);
  app.proto.go = self.go.bind(self);
  app.go = self.go.bind(self);

  self.setupRouter();
}

Router.prototype.setupRouter = function(){
  var self = this;

  self.app._router = self.app.router;

  this.app.router = function(options){
    var express = derby.util.serverRequire(module, 'express');
    var router = express.router(options);
    var appRouter = self._router(options);

    router.use(appRouter);

    return router;
  };
};

Router.prototype.route = function(){
  var args = Array.prototype.slice.call(arguments);
  var opts = options.handleRoute(args);
  new Route(this, opts);
};

Router.prototype.module = function(name, moduleObj){
  new Module(this, name, moduleObj);
};


Router.prototype.pathFor = function(name, options){
  var args = Array.prototype.slice.call(arguments);
  var name = args.shift();

  var route = this.routes[name];

  if (!route) {
    throw Error('There is no such a route: '+ name);
  }

  return route.resolve.apply(route, args);
};

Router.prototype.go = function(name, options){
  var args = Array.prototype.slice.call(arguments);
  var path = this.pathFor.apply(this, args);
  this.app.history.push(path);
};


module.exports = Router;