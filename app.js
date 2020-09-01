const express = require('express');
const fileUpload = require('express-fileupload');
const low = require('lowdb');
const multer = require('multer');
const fs = require("fs");
const bodyParser = require('body-parser');
const FileSync = require('lowdb/adapters/FileSync');
const cors = require('cors');
const { Console } = require('console');
const productName = "products";
const categoryName = "category";
const ordersName = "orders";
const toppingsName = "toppings";
const userName = "user";

const adapterProduct = new FileSync('./db/products.json');
const adapterCategory = new FileSync('./db/category.json');
const adapterOrders = new FileSync('./db/orders.json');
const adapterTopping = new FileSync('./db/toppings.json');
const adapterUser = new FileSync('./db/user.json');

const productsData = low(adapterProduct);
const categoryData = low(adapterCategory);
const ordersData = low(adapterOrders);
const toppingsData = low(adapterTopping);
const userData = low(adapterUser);

const app = express();
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static(__dirname + '/images'));

const PORT = 3001;
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/images')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
})

var upload = multer({ storage: storage })
app.use(fileUpload())
app.use(cors());

app.get('/', (req, res) => {
  const ret = 'hello from products api';
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(ret);
})

// Update load image
app.post('/upload', (req, res) => {
  // console.log(req.body)
  var file = req.files.file;
  let path = __dirname + "/images/" + file.name;
  fs.writeFile(path, file.data, function (err) {
    if (err) {
      console.log(err);
    } else {
      response = {
        message: 'File uploaded successfully',
        filename: req.files.file.name
      };
    }
    console.log(response);
    res.end(JSON.stringify(response));
  });
})

// product api
app.get('/products', (req, res) => {
  const products = productsData.get(productName).value();
  let result = products.filter(x => {
    return  !x.unActived
  })
  res.json(result);
})

app.get('/products/:id', (req, res) => {
  const id = +req.params.id;
  const ret = productsData.get(productName)
    .find({ id: id.toString() })
    .value();
  res.json(ret);
})

app.get('/products/category/:id', (req, res) => {
  const category = +req.params.id;
  const ret = productsData.get(productName)
    .chain().filter({ category: category.toString()}).value();
  let result = ret.filter(x => {
    return  !x.unActived
  })
  res.json(result);
})

app.get('/products/removed/:id', (req, res) => {
  const id = +req.params.id;
  let result = [];
  if (id == '0'){
    result = productsData.get(productName).chain().filter({unActived: true }).value();
  }
  else {
    result = productsData.get(productName).chain().filter({ category: id.toString(), unActived: true }).value();
  }
  res.json(result);
})

app.get('/products/searchbyname/:name/:isActived', (req, res) => {
  let name = req.params.name;
  let isActived = req.params.isActived;
  const products = productsData.get(productName).value();
  let result = []
  if(name.trim() !== '' && name != 'undefined'){
    result = products.filter(x => {
      let productName = x.name.toLowerCase();
      return productName.includes(name.toLowerCase()) && !x.unActived == JSON.parse(isActived.toLowerCase())
    })
  }else {
    result = products.filter(x => {
      return !x.unActived == JSON.parse(isActived.toLowerCase())
    })
  }
  res.json(result);
})

app.post('/products/add', (req, res) => {
  var data = Object.assign({}, req.body);
  var file = req.files.file;
  try {
    var id = Date.now().toString();
    var obj = {
      "category": data.category,
      id,
      "image": file.name,
      "name": data.name,
      "price": data.price.toString(),
      "toppings": data.topping.split(',').map(x => parseInt(x))
    }
    console.log(obj)
    let path = __dirname + "/images/" + file.name;
    fs.writeFile(path, file.data, function (err) {
      if (err) {
        console.log(err);
        res.status(500).send({error: 'Fail to create product'});
      }
    });
    const ret = productsData.get(productName)
      .push(obj)
      .write();
    res.send("OK");
  } catch (err) {
    res.status(500).send({error: 'Fail to create product'});
  }
})

app.post('/products/edit', (req, res) => {
  var data = Object.assign({}, req.body);
  var file = req.files.file;
  try {

    const ret = productsData.get(productName)
      .chain().find({ id: data.id.toString() });
    if (!ret.value())
      res.status(400).send({ err: "fail" });

    let path = __dirname + "/images/" + file.name;
    fs.writeFile(path, file.data, function (err) {
      if (err) {
        console.log(err);
        res.status(500).send({error: 'Fail to create product'});
      }
    });

    let obj = {}
    console.log(obj)
    console.log(ret.value())
    obj.category = data.category
    obj.image = file.name
    obj.name = data.name
    obj.price = data.price.toString()
    obj.toppings = data.topping.split(',').map(x => parseInt(x))

    ret.assign(obj).write();
    res.send("OK");
  } catch (err) {
    res.status(400).send(err);
  }
})

app.post('/products/delete', (req, res) => {
  const data = req.body;
  const ret = productsData.get(productName).chain().find({ id: data.id.toString() });
  let obj = Object.assign({}, ret.value())
  obj.unActived = true;
  obj.note = data.reason;
  ret.assign(obj).write();
  res.json(ret);
})

app.get('/products/undo/:id', (req, res) => {
  const id = +req.params.id;
  const ret = productsData.get(productName).chain().find({ id: id.toString() });
  let obj = Object.assign({}, ret.value())
  obj.unActived = false
  ret.assign(obj).write();
  res.json(ret);
})
// end products

// category
app.get('/category', (req, res) => {
  const menu = categoryData.get(categoryName);
  res.json(menu);
})

app.post('/category/add', (req, res) => {
  const obj = req.body;
  try {
    const ret = categoryData.get(categoryName)
      .push(obj)
      .write();
    res.send("OK");
  } catch (err) {
    res.send(err);
  }
})

app.post('/category/edit', (req, res) => {
  const obj = req.body;
  try {
    const ret = categoryData.get(categoryName)
      .chain().find({ id: obj.id });
    if (!ret.value())
      res.status(400).send({ err: "fail" });

    ret.assign(obj).write();
    res.send("OK");
  } catch (err) {
    res.status(400).send(err);
  }
})
// end category

// oders
app.get('/orders', (req, res) => {
  const menu = ordersData.get(ordersName);
  res.json(menu);
})

app.post('/orders/add', (req, res) => {
  const obj = req.body;
  try {
    const ret = ordersData.get(ordersName)
      .push(obj)
      .write();
    res.send("OK");
  } catch (err) {
    res.send(err);
  }
})

app.get('/orders/:id', (req, res) => {
  const id = +req.params.id;
  const ret = ordersData.get(ordersName).find({ id }).value();
  res.json(ret);
})

// end orders

// topping
app.get('/topping', (req, res) => {
  const topping = toppingsData.get(toppingsName);
  res.json(topping);
})

// end otopping

app.listen(PORT, () => {
  console.log(`API running on port http:\\localhost:${PORT}`);
});