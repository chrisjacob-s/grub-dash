const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

function bodyHasDeliverProperty(req, res, next) {
  const { data: { deliverTo } = {} } = req.body;
  if (deliverTo) {
    return next();
  }
  next({
    status: 400,
    message: `A 'deliverTo' property is required.`,
  });
};

function bodyHasMobileProperty(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;
  if (mobileNumber) {
    return next();
  }
  next({
    status: 400,
    message: `A 'mobileNumber' property is required.`,
  });
};

function bodyHasStatusProperty(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (status) {
    return next();
  }
  next({
    status: 400,
    message: `A 'status' property is required.`,
  });
};

function statusHasValidString(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (status.includes("pending") || status.includes("preparing") || status.includes("out-for-delivery") || status.includes("delivered")) {
    return next();
  }
  next({
    status: 400,
    message: `status property must be valid string: 'pending', 'preparing', 'out-for-delivery', or 'delivered'`,
  });
};

function bodyHasDishesProperty(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (dishes) {
    return next();
  }
  next({
    status: 400,
    message: `A 'dishes' property is required.`,
  });
};

function dishesIsValidArray(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (!Array.isArray(dishes) || dishes.length == 0) {
    next({
      status: 400,
      message: `invalid dishes property: dishes property must be non-empty array`,
  });
  }
  next();
};

function dishesArrayHasValidQuantity(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  dishes.forEach((dish) => {
    const quantity = dish.quantity;
    if (!quantity || quantity <= 0 || typeof quantity !== "number") {
      return next ({
        status: 400,
        message: `dish ${dish.id} must have quantity property, quantity must be an integer, and it must not be equal to or less than 0`
      });
    }
  }); 
  next();
};

function dataIdMatchesOrderId(req, res, next) {
  const { data: { id } = {} } = req.body;
  //const id = req.body.data.id;
  const orderId = req.params.orderId;
  if (id !== undefined && id !== null && id !== "" && id !== orderId) {
    next({
      status: 400,
      message: `id ${id} must match orderId provided in parameters`,
    });
  }
   return next();
};

function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  if(foundOrder) {
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${req.params.orderId}`,
  });
};

function list(req, res) {
  res.json({ data: orders });
};

function read(req, res) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  res.json({ data: foundOrder });
};

function create(req, res) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status: "out-for-delivery",
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
};

function update(req, res) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.status = status;
  foundOrder.dishes = dishes;
  res.json({ data: foundOrder });
};

function destroy(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  if (foundOrder.status === "pending") {
    const index = orders.findIndex((order) => order.id === Number(orderId));
    orders.splice(index, 1);
    res.sendStatus(204);
  }
  return next ({
      status: 400,
      message: `order cannot be deleted unless order status = 'pending'`,
    });
};

module.exports = {
  list,
  read: [orderExists, read],
  create: [bodyHasDeliverProperty, bodyHasMobileProperty, bodyHasDishesProperty, dishesIsValidArray, dishesArrayHasValidQuantity, create],
  update: [orderExists, dataIdMatchesOrderId, bodyHasDeliverProperty, bodyHasMobileProperty, bodyHasDishesProperty, bodyHasStatusProperty, statusHasValidString, dishesIsValidArray, dishesArrayHasValidQuantity, update],
  delete: [orderExists, destroy],
};