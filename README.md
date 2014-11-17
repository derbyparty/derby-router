## Derby 0.6 router

### Getting started

Install: `npm install derby-router`

Add the package into your derby application:

*index.js*
```js
var derby = require('derby');
var app = derby.createApp('app', __filename);

app.use(require('derby-router'));

// named route
app.get('main', '/main', function(page, model, params, next){
  var self = this;
  var items = model.query('items', {});
  items.subscribe(function(){
    items.ref('_page.items');
    page.render('main');
  })
});

// you can access model via this.model
// and page.render via this.render()
app.get('item', '/item/:id', function(){
  var self = this;
  var item = this.model.at('items.' + this.params.id);
  item.subscribe(function(){
    item.ref('_page.item');
    self.render();
  });
});

// server get route
app.serverGet('time', '/api/time', function(req, res, next){
  res.json(Date.now());
});
```

*main.html*
```html
<index:>
  <h1>Items:</h1>

  {{each _page.items as #item}}

    <!-- pathFor view function returns the right url -->
    <!-- like /item/4380fefc-001d-493a-aa2b-5e3d512e587d -->
    <a href="{{pathFor('item', #item.id)}}">{{#item.name}}</a>
  {{/each}}

```

## Routes

Derby-router allows to create routes for `get`, `post`, `put` and `del` requests
for both **derby-** and **server-** sides.

```js
// Derby-app routes
app.get(...);
app.post(...);
app.put(...);
app.del(...);

// Server routes
app.serverGet(...);
app.serverPost(...);
app.serverPut(...);
app.serverDel(...);
```

### Route names and paths

First two parameters in routes are `name` and `path`. For example:
```js
app.get('main', '/main');
```
Their order is not actually important, so you can define the route like this:
```js
app.get('/main', 'main');
```
Or simply:
```js
app.get('main');
```
In the latter case the path is going to be generated automatically from the route name: 'main' -> '/main'.
Here are some more examples:

| name | path |
|------|------|
| main | /main |
| items:item | /items/item |

This is quite convinient for sipmle paths. 

It's also possible to define only **paths** -- in this case **names** are gonna be converted automatically. 
For example you can define the route like this:

```js
app.get('/main');
```

A few more examples:

| path | name |
|------|------|
| /main | main |
| /items/item | items:item |
| /articles/:id | articles:id |
| / | home (special case) |

The recommended way is to define both `name` and `path` explicitly.

### Path parameters

Derby-router uses [path-to-regexp](https://github.com/pillarjs/path-to-regexp) to
parse paths. It's express-like parsing engine. Take a look at
[path-to-regexp](https://github.com/pillarjs/path-to-regexp) docs to find out more.

Short list of possibilities:

| path | exemple | description |
|------|------|------|
| /:foo/:bar | /test/route | named parameters |
| /:foo/:bar? | /test, /test/route | optional parameter |
| /:foo* | /, /test, /test/test | zero or more |
| /:foo+ | /test, /test/route | one or more |
| /:foo(\\d+) | /123, /abc | custom match parameters |
| /:foo/(.*) | /test/route | unnamed parameters |


### Derby-application routes

Syntax: `app.method(name?, path?, [handler]*, options?)`

`method`: one of 'get', 'post', 'put', 'del'

`name`: string - name of the route, you can use it to obtain the corresponding URL using the `pathFor` view function.

`path`: string (should starts with '/')

`handler`: one of a list of route-handlers. You can omit it, in which case the `name`-template
is going to be rendered. There are two types of handlers:

- handler-function
- array of route-modules (more on this later)

`options` - an options object. You can specify the following options:

- dontRender - boolean. By default the route's view is being rendered automatically. Set this option to `true` to prevent it.
- derbyController - function. Overrides default derby-app route-controller

#### Handler-functions

Derby-application handler-functions accept the same arguments as the original derby router: `page`, `model`,
`params` and `next`. For example:

```js
app.get('main', '/main', function(page, model, params, next){
  // ...
});
```

`this` inside handler-function is `DerbyRouteController`. It provides access to additional properties:

| property | description |
|----------|-------------|
| this.name | route name |
| this.app | derby-app variable |
| this.page | page - the same as in arguments |
| this.model | model - the same as in arguments |
| this.params | params - the same as in arguments |
| this.path | route-path |
| this.next | next - the same as in arguments |
| this.render | render-function (by default the router renders template with the name of the route) |
| this.loadModules | function which accepts a list of **modules' names** and executes their `load` functions |
| this.setupModules | this function subscribes to all of the loaded modules' data and exetutes their `setup` functions |
| this.addSubscription | this function adds module subscriptions to the list. The actual subscribtion for the whole list will be done later in `this.setupModules` function |

It's also possible to use several functions in one route. For example:

```js
function isAdmin(){
  if (this.model.get('_session.user.admin'){
    this.next();
  } else {
    this.next('User should be an admin to get access!');
  }
}

app.get('admin', isAdmin, function(){
  // ...
});
```

#### Router modules

With derby-router you can use so called "router modules".
derby-router allow you to write routes in a declarative way and to easily assemble big applications while keeping your code DRY. To achieve this you need to write so called "router modules" and plug them into various routes.

Here is a simple example:

```js
app.get('/main', function(page, model, params, next){
  var userId = model.get('_session.userId');
  var user = model.at('users.' + userId);

  model.subscribe(user, function(){
    user.ref('_page.user');
    page.render('main');
  });
});
```

The user-subscription is a frequently used task. We usually do it in almost every route. Router-modules will help us to keep it DRY.

First note that while working with subscriptions we often have two parts of code: before
subscription and after subscription. We call this parts `load`-block and
`setup`-block.

Let's write the user-module:

```js
app.module('user', {
  load: function(){
    var userId = this.model.get('_session.userId');
    this.user = this.model.at('users.' + userId);
    this.addSubscriptions(user);
  },
  setup: function(){
    this.model.ref('_page.user', this.user);
  }
});
```

and use it in our handler:

```js
app.get('/main', function(){
  this.loadModules('user');
  // setup all loaded modules
  this.setupModules(function(){
    // by defauld render use name of the route
    // as a rendered template-name, so
    // it's 'main'
    this.render();
  });
});
```

but there is more convenient way to use router-modules:

```js
app.get('/main', ['user']);
```

Let's imagine more complex example. We should subscribe to the current user and
then to all his friends.

```js
app.get('/main', function(page, model, params, next){
  var userId = model.get('_session.userId');
  var user = model.at('users.' + userId);

  model.subscribe(user, function(){
    user.ref('_page.user');

    var friends = model.query('users', user.path('friendIds'));

    model.subscribe(friends, function(){
      page.render('main');
    };
  });
});
```

Module 'friends' will be something like this:

```js
app.module('friends', {
  load: function(user){
    var friends = this.model.query('users', user.user.path('friendIds'));
    this.addSubscriptions(friends);
  }
  // We don't need setup-function here
});
```

Note 'user'-parameter. It's a user-module. After, we can define router like this:

```js
app.get('/main', ['user', 'friends']);
```

Derby-router understand dependencies and make "depencency injections".

Also, we can combine functions with modules, f.e.:

```js
app.get('/main', isAdmin, ['user', 'friends']);
```

### Server routes

Server-routes are like derby-application routes, but without router-modules, and
they have a little bit different API.

Basically, like in derby-application routes we can use four methods for
server-routes: 'get', 'post', 'put', 'del'.

Syntax: `app.serverMethod(name?, path?, [handlers]*, options?)`

`Method`: one of 'Get', 'Post', 'Put', 'Del'

`name`: string - name of the route, you can use the name to get specific url
using `pathFor`-view function

`path`: string (should starts with '/')

`handlers`: a list of handler-functions. May be omitted, if so nothing will
happen

`options` - an object with options. At the moment you can define such options:

- serverController - function - to override default server route-controller

#### Handler-functions

Handler-functions accept usual expressjs parameters: req, res and next. For
example:

```js
app.serverGet('api:time', '/api/time', function(req, res, next){
  res.json(Date.now());
});
```

But also `this` in the function is `ServerRouteController` which provide some
additional functionality:

| property | description |
|----------|-------------|
| this.name | route name |
| this.app | derby-app variable |
| this.model | model - like in parameters |
| this.params | params - like in derby-application routes |
| this.path | route-path |
| this.next | next - like in parameters |

It's also possible to use a few functions in one route. For example:

```js
function isAdmin(){
  if (this.model.get('_session.user.admin'){
    this.next();
  } else {
    this.next('User should be an admin to get access!');
  }
}

app.serverGet('admin', isAdmin, function(){
  // ...
});
```

#### The way to hide server code from browser bundle

Typical pattern is:

```js
var derby = require('derby');

var app = derby.createApp('app', __filename);

var serverRoutes = derby.util.serverRequire(module, './server') || {};

// common derby-routes
app.get(...);
// ...

// Server-routes
app.serverPost('api:time', '/api/time', serverRoutes.time);
app.serverPost('api:foo', '/api/foo', serverRoutes.foo);
app.serverPost('api:bar', '/api/bar', serverRoutes.bar);
```

## View-function `pathFor`

For all routes we can get specific url in templates using view-function
`pathFor`, for example:

```js
app.get('item', '/items/:id', function(){
  // ...
});
```

```html
<a href="{{pathFor('item', #item.id)}}">{{#item.name}}</a>
```

There are two syntax for `pathFor`-function:

Simple syntax: `pathFor(name, [param1, param2, ...])`

- `name` - route-name
- `param1`, `paramN` - route parameters in the order of the params in the
route-path, for example:

```js
app.get('foobar', '/new/:foo/:bar+/(.*)', function(){
  // ...
});
```

```html
<!-- here we get /new/one/two/three/four url -->
<a href="{{pathFor('foobar', 'one', 'two', 'three/four')}}">foobar</a>
```

Object syntax: `pathFor(name, options)`

- `name` - route-name
- `options` - object of named route params, from example:

```js
app.get('foobar', '/new/:foo/:bar+/(.*)', function(){
  // ...
});
```

```html
<!-- here we get /new/one/two/three/four url -->
<a href="{{pathFor('foobar', {foo: 'one', bar: ['two', 'three'], 0: 'four'})}}">
  foobar
</a>
```

Note 0 param. For unnamed params like (.*) we use number-keys.

### Query and hash

Additionally we can pass two special params in the pathFor options:

- $query - query string or query-object
- $hash - hash string

For example:

```js
app.get('main', '/main', function(){
  // ...
});
```

```html
<!-- here we get /main?foo=abc#bar url -->
<a href="{{pathFor('main', {$query: {foo: 'abc'}, $hash: 'bar'})}}">foobar</a>
```

## MIT License
Copyright (c) 2014 by Artur Zayats

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.