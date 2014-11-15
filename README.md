## Derby 0.6 router

### Getting started

Install: `npm install derby-router`

Add the package in your derby application:

index.js
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

main.html
```html
<index:>
  <h1>Items:</h1>

  {{each _page.items as #item}}

    <!-- view function pathFor return right url-->
    <!-- like /item/4380fefc-001d-493a-aa2b-5e3d512e587d -->
    <a href="{{pathFor('item', #item.id)}}">{{#item.name}}</a>
  {{/each}}

```


