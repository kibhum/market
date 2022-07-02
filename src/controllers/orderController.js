const { pool, mssql } = require("../db/mssql");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.addOrder = catchAsync(async (req, res, next) => {
  // console.log(req.body);
  let { items, supplier, totalPrice, paymentMethod } = req.body;

  if (items.length === 0) {
    // items.forEach((order) => {
    return next(new AppError(`Select items to order!`, 400));
    // );
  }
  if (items) {
    // items.forEach((order) => {
    for (const order of items) {
      const { batchNumber, item, quantity, unitBuyingPrice, totalBuyingPrice } =
        order;

      if (
        !batchNumber ||
        !quantity ||
        !unitBuyingPrice ||
        !item ||
        !Number(totalBuyingPrice) > 0
      ) {
        return next(new AppError(`Provide all Item details!`, 400));
      }
      const query = `SELECT * FROM Batches where batchNumber='${batchNumber}' AND item='${item}'`;
      const sql = await pool.request().query(query);
      if (sql.recordset.length === 0) {
        return next(
          new AppError(
            `Invalid batchNumber or batchNumber and item don't match!`,
            400
          )
        );
      }
    }
    // );
  }
  if (!totalPrice || !paymentMethod || !supplier || !items) {
    return next(new AppError(`Provide all Order details!`, 400));
  }

  const query = `INSERT INTO PurchaseOrders 
  ( 
    purchaseOrderNumber,
    supplierId,
    items,
    status,
    totalPrice,
    createdBy,
    dateCreated,
    dateModified,
    paymentMethod
  ) 

  values (
    @purchaseOrderNumber,
    @supplierId,
    @items,
    @status,
    @totalPrice,
    @createdBy,
    @dateCreated,
    @dateModified,
    @paymentMethod
  ) `;

  await pool
    .request()
    .input("purchaseOrderNumber", mssql.VarChar, `P${new Date().getTime()}`)
    .input("supplierId", mssql.VarChar, req.supplierId)
    .input("totalPrice", mssql.Float, totalPrice)
    .input("items", mssql.NVarChar, JSON.stringify(items))
    .input("paymentMethod", mssql.VarChar, paymentMethod)
    .input("status", mssql.Int, 1)
    .input("createdBy", mssql.VarChar, req.user.userId)
    .input("dateCreated", mssql.DateTimeOffset, new Date().toISOString())
    .input("dateModified", mssql.DateTimeOffset, new Date().toISOString())
    .query(query);

  res.status(201).json({
    success: true,
    message: "Order successfully Created!",
  });
});
exports.updateOrder = catchAsync(async (req, res, next) => {
  const queryOrder = `SELECT * FROM PurchaseOrders WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryOrder);
  if (sql.recordset.length === 0) {
    return next(new AppError("Order not found!", 404));
  }
  let { items, supplier, totalPrice, paymentMethod } = req.body;

  if (items.length === 0) {
    // items.forEach((order) => {
    return next(new AppError(`Select items to order!`, 400));
    // );
  }
  if (items) {
    // items.forEach((order) => {
    for (const order of items) {
      const { batchNumber, item, quantity, unitBuyingPrice, totalBuyingPrice } =
        order;

      if (
        !batchNumber ||
        !quantity ||
        !unitBuyingPrice ||
        !item ||
        !Number(totalBuyingPrice) > 0
      ) {
        return next(new AppError(`Provide all Item details!`, 400));
      }
      const query = `SELECT * FROM Batches where batchNumber='${batchNumber}' AND item='${item}'`;
      const sql = await pool.request().query(query);
      if (sql.recordset.length === 0) {
        return next(
          new AppError(
            `Invalid batchNumber or batchNumber and item don't match!`,
            400
          )
        );
      }
    }
    // );
  }
  if (!totalPrice || !paymentMethod || !supplier || !items) {
    return next(new AppError(`Provide all Order details!`, 400));
  }

  const query = `UPDATE PurchaseOrders SET 
  supplierId=@supplierId,
  totalPrice=@totalPrice,
  dateModified=@dateModified,
  items=@items,
  paymentMethod=@paymentMethod,
  updatedBy=@updatedBy
  WHERE id=${req.params.id}`;

  await pool
    .request()
    .input("supplierId", mssql.VarChar, req.supplierId)
    .input("totalPrice", mssql.Float, totalPrice)
    .input("items", mssql.NVarChar, JSON.stringify(items))
    .input("paymentMethod", mssql.VarChar, paymentMethod)
    .input("updatedBy", mssql.VarChar, req.user.userId)
    .input("dateModified", mssql.DateTimeOffset, new Date().toISOString())
    .query(query);

  res.status(200).json({
    status: "Success",
    message: "Order Updated!",
  });
});
exports.deleteOrder = catchAsync(async (req, res, next) => {
  const queryCategory = `SELECT * FROM PurchaseOrders WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryCategory);
  if (sql.recordset.length === 0) {
    return next(new AppError("Order not found!", 404));
  }

  const query = `DELETE FROM PurchaseOrders WHERE  id=${req.params.id}`;

  await pool.request().query(query);
  res.status(200).json({
    status: "Success",
    message: "Order Deleted!",
  });
});
exports.getOrders = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM PurchaseOrders`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("No Products yet!", 404));
  }
  // console.log(sql.recordset);
  sql.recordset.forEach((order) => {
    order.items = JSON.parse(order.items);
  });

  res.status(200).json(sql.recordset);
});
exports.getOrder = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM PurchaseOrders WHERE id=${req.params.id}`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("Order Not found!", 404));
  }
  const order = sql.recordset[0];
  order.items = JSON.parse(order.items);
  res.status(200).json({
    status: "Success",
    order,
  });
});
exports.getOrdersByPurchaseOrderNumber = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM PurchaseOrders WHERE purchaseOrderNumber='${req.params.purchaseOrderNumber}'`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("Order Not found!", 404));
  }
  let itemsOrdered;
  sql.recordset.forEach((order) => {
    itemsOrdered = JSON.parse(order.items);
  });

  res.status(200).json({
    status: "Success",
    itemsOrdered,
  });
});

exports.ordersByCreatedDate = catchAsync(async (req, res, next) => {
  if (!new Date(req.params.date).getTime()) {
    return next(new AppError("Enter a valid date!", 400));
  }
  const query = `SELECT * FROM PurchaseOrders WHERE dateCreated>${new Date(
    req.params.date
  ).getTime()}`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("No Orders Created From that date yet!", 404));
  }
  sql.recordset.forEach((order) => {
    order.items = JSON.parse(order.items);
  });

  res.status(200).json(sql.recordset);
});

exports.modifyOrder = catchAsync(async (req, res, next) => {
  const querySale = `SELECT * FROM PurchaseOrders WHERE purchaseOrderNumber='${req.params.purchaseOrderNumber}' `;
  const sql = await pool.request().query(querySale);
  if (sql.recordset.length === 0) {
    return next(new AppError("Purchase Order not found!", 404));
  }
  const queryPurchaseOrderstatus = `SELECT status FROM PurchaseOrders WHERE purchaseOrderNumber='${req.params.purchaseOrderNumber}' `;
  const sqlStat = await pool.request().query(queryPurchaseOrderstatus);
  const PurchaseOrderstate = sqlStat.recordset[0].status;
  if (Number(PurchaseOrderstate) === 2) {
    return next(new AppError("Order has already been approved!", 403));
  }

  let { status } = req.body;
  if (!status) {
    return next(
      new AppError(`Provide a status for which the item should be in!`, 400)
    );
  }

  if (status == "pending" || status == "approved") {
    if (status === "pending") {
      status = 1;
      const query = `UPDATE PurchaseOrders SET 
  status=@status
  WHERE  purchaseOrderNumber='${req.params.purchaseOrderNumber}'`;

      await pool.request().input("status", mssql.Int, status).query(query);
    }
    if (status === "approved") {
      status = 2;
      const query = `UPDATE PurchaseOrders SET 
      status=@status,
      approvedBy=@approvedBy,
      dateApproved=@dateApproved
      WHERE  purchaseOrderNumber='${req.params.purchaseOrderNumber}'`;
      await pool
        .request()
        .input("status", mssql.Int, status)
        .input("dateApproved", mssql.DateTimeOffset, new Date().toISOString())
        .input("approvedBy", mssql.VarChar, req.user.userId)
        .query(query);
    }

    return res.status(200).json({
      status: "Success",
      message: `Order has been modified to: ${
        status === 1 ? "pending" : "approved"
      } `,
    });
  }
  res.status(400).json({
    status: "Fail",
    message: `${status} is not appropriate!`,
  });
});
