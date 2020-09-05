const express = require('express');
const low = require('lowdb');
const bodyParser = require('body-parser');
const FileSync = require('lowdb/adapters/FileSync');
const cors = require('cors');
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

app.use(cors());

const PORT = 3001;  

app.get('/', (req, res) => {
  const ret = 'hello from products api.';
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(ret);
})

// product api
app.get('/products', (req, res) => {
  const products = productsData.get(productName);
  res.json(products.value());
})

app.get('/products/:id', (req, res) => {
  const id = +req.params.id;
  const ret = productsData.get(productName)
    .find({ id })
    .value();
  res.json(ret);
})

app.get('/products/category/:id', (req, res) => {
  const category = +req.params.id;
  const ret = productsData.get(productName)
    .chain().filter({ category }).value();
  res.json(ret);
})

app.post('/products/add', (req, res) => {
  const obj = req.body;
  try{
    const ret = productsData.get(productName)
    .push(obj)
    .write();
    res.send("OK");
  }catch(err){
    res.send(err);
  }
})

app.post('/products/edit', (req, res) => {
  const obj = req.body;
  try{
    const ret = productsData.get(productName)
    .chain().find({ id: obj.id});
    if(!ret.value())
      res.status(400).send({err: "fail"});
   
    ret.assign(obj).write();
    res.send("OK");
  }catch(err){
    res.status(400).send(err);
  }
})
// end products

// category
app.get('/category', (req, res) => {
  const menu = categoryData.get(categoryName);
  res.json(menu);
})

app.post('/category/add', (req, res) => {
  const obj = req.body;
  try{
    const ret = categoryData.get(categoryName)
    .push(obj)
    .write();
    res.send("OK");
  }catch(err){
    res.send(err);
  }
})

app.post('/category/edit', (req, res) => {
  const obj = req.body;
  try{
    const ret = categoryData.get(categoryName)
    .chain().find({ id: obj.id});
    if(!ret.value())
      res.status(400).send({err: "fail"});
   
    ret.assign(obj).write();
    res.send("OK");
  }catch(err){
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
  try{
    const ret = ordersData.get(ordersName)
    .push(obj)
    .write();
    res.send("OK");
  }catch(err){
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
  console.log(topping)
  res.json(topping);
})

// end otopping

app.listen(PORT, () => {
  console.log(`API running on port http:\\localhost:${PORT}`);
});