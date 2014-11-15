var derby = require('derby');
var Route = require('./Route');
var Module = require('./Module');
var util = require('./utils/util');
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
    app['server' + util.capitalize(method)] = self.serverRoute.bind(self, method);
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
    var router = express.Router(options);
    var appRouter = self.app._router(options);

    router.use(appRouter);

    // TODO register server routes HERE

    for(var name in self.routes){
      var route = self.routes[name];
      if (route.opts.isServerRoute) {
        //var params = [route.regexp].concat(route.opts.fns);
        console.log('register server route');
        console.log('name', route.name);
        console.log('path', route.path);
        console.log('method', route.opts.method);
        router[route.opts.method].call(router, route.regexp, route.serverAction.bind(route));
      }
    }
    return router;
  };
};

Router.prototype.route = function(){
  var args = Array.prototype.slice.call(arguments);
  var opts = options.handleRoute(args);
  new Route(this, opts);
};

Router.prototype.serverRoute = function(){
  var args = Array.prototype.slice.call(arguments);
  var opts = options.handleRoute(args);
  opts.isServerRoute = true;
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