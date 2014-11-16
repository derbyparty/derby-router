## Derby 0.6 router

### Getting started

Install: `npm install derby-router`

Add the package in your derby application:

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

  // name route using this.model
  // and this.render() it's equal page.render('item')
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

    <!-- view function pathFor return right url-->
    <!-- like /item/4380fefc-001d-493a-aa2b-5e3d512e587d -->
    <a href="{{pathFor('item', #item.id)}}">{{#item.name}}</a>
  {{/each}}

```

## Routes

Derby-router allows to create 'get', 'post', 'put' and 'del' types of derby
application routes, and the same four types of server routes.

```js
  // derby-app routes
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

### Route names and pathes

First two parameters in routes are `name` and `path`. For example:
```js
app.get('main', '/main');
```
To tell the truth the order is not important, so you can define the route like
this:
```js
app.get('/main', 'main');
```
Or even just:
```js
app.get('main');
```
Path will be extract automatically from the name: 'main' -> '/main'
Look at the examples:

| name | path |
|------|------|
| main | /main |
| items:item | /items/item |

That is quite convinient for sipmle pathes, also possible to define only `pathes`,
so `names` will be converted automatically. For example you can define the route
like this:
```js
app.get('/main');
```

A couple of examples:

| path | name |
|------|------|
| /main | main |
| /items/item | items:item |
| /articles/:id | articles:id |
| / | home (special case) |

Of course the best way is to define both `name` and `path` explicitly.

### Path parameters

Derby-router use [path-to-regexp](https://github.com/pillarjs/path-to-regexp) to
parse pathes. It's express like parsing engine, so read the docs for it.

Short list of possibilities:

| path | exemple | description |
|------|------|------|
| /:foo/:bar | /test/route | named parameters |
| /:foo/:bar? | /test, /test/route | optionsl parameter |
| /:foo* | /, /test, /test/test | zero or more |
| /:foo+ | /test, /test/route | one or more |
| /:foo(\\d+) | /123, /abc | custom match parameters |
| /:foo/(.*) | /test/route | unnamed parameters |



