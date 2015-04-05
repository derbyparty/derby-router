var derby = require('derby');
var Route = require('./Route');
var Module = require('./Module');
var util = require('./utils/util');
var options = require('./utils/options');
var methods = ['get', 'post', 'put', 'del'];

function Router(app, options){
  // get rid of new
  if (!(this instanceof Router)){
    var obj = Object.create(Router.prototype);
    obj.constructor.apply(obj, arguments);
    return obj;
  }

  var self = this;

  self.options = options || {};

  self.app = app;

  self.routes = {};
  self.modules = {};

  methods.forEach(function(method){
    app['_'+method] = app[method];
    app[method] = self.derbyRoute.bind(self, method);
    app['server' + util.capitalize(method)] = self.serverRoute.bind(self, method);
  });

  app.route = self.externalRoute.bind(self);

  app.module = self.module.bind(self);
  app.pathFor = app.proto.pathFor = self.pathFor.bind(self);
  app.go = app.proto.go = self.go.bind(self);

  app.Router = self;

  self.setupRouter();
}

Router.prototype.setupRouter = function(){
  var self = this;

  // Save track's old Router
  self.app._router = self.app.router;

  this.app.router = function(options){
    var express = derby.util.serverRequire(module, 'express');
    var router = express.Router(options);
    var appRouter = self.app._router(options);

    router.use(appRouter);

    for(var name in self.routes){
      var route = self.routes[name];
      if (route.opts.type === 'server') {
        router[route.opts.method].call(router, route.path, route.serverAction.bind(route));
      }
    }
    return router;
  };
};

Router.prototype.externalRoute = function(name, path){
  var opts = {
    name: name,
    path: path,
    type: 'external'
  };
  Route(this, opts);
};

Router.prototype.derbyRoute = function(){
  var args = Array.prototype.slice.call(arguments);
  var opts = options.handleRoute(args);
  opts.type = 'derby';
  Route(this, opts);
};

Router.prototype.serverRoute = function(){
  var args = Array.prototype.slice.call(arguments);
  var opts = options.handleRoute(args);
  opts.type = 'server';
  Route(this, opts);
};

Router.prototype.module = function(name, moduleObj){
  Module(this, name, moduleObj);
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