var Route = require('./Route');
var Module = require('./Module');

var options = require('./utils/options');
var methods = ['get', 'post', 'put', 'del'];
var Router = function(app, options){
  var self = this;

  this.options = options || {};

  this.app = app;

  this.routes = {};
  this.modules = {};

  app._router = this;

  methods.forEach(function(method){
    app['_'+method] = app[method];
    app[method] = self.route.bind(self, method);
  });

  app.module = this.module.bind(this);
  app.proto.pathFor = this.pathFor.bind(this);
  app.proto.go = this.go.bind(this);
  app.go = this.go.bind(this);
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