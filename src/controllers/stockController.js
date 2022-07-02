const { pool, mssql } = require("../db/mssql");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.addStock = catchAsync(async (req, res, next) => {
  // console.log(req.body);
  let batchItems = [];
  let { purchaseOrderNumber, items, deliveredBy, receivedBy } = req.body;

  if (!purchaseOrderNumber || !deliveredBy || !receivedBy || !items) {
    return next(new AppError(`Provide all stock details!`, 400));
  }
  const queryUniqueOrderNumber = `SELECT * FROM StockReceipts WHERE  purchaseOrderNumber='${purchaseOrderNumber}' `;
  const sqlOrder = await pool.request().query(queryUniqueOrderNumber);
  if (sqlOrder.recordset.length > 0) {
    return next(new AppError(`The PurchaseOrderNumber already received!`, 400));
  }
  // validating purchase orders
  const queryPurchaseOrderNumber = `SELECT * FROM PurchaseOrders WHERE  purchaseOrderNumber='${purchaseOrderNumber}' `;
  const sqlPurchase = await pool.request().query(queryPurchaseOrderNumber);
  if (sqlPurchase.recordset.length === 0) {
    return next(new AppError(`The PurchaseOrderNumber is not valid!`, 400));
  }
  // Limiting to one stock name

  // Verifying batches
  // items.forEach(async (item) => {
  //   const queryBatch = `SELECT * FROM Batches WHERE item='${item.item}'`;
  //   const sqlBatch = await pool.request().query(queryBatch);
  //   if (sqlBatch.recordset.length === 0) {
  //     return next(
  //       new AppError(`Create a batch with name:'${item.item}' to proceed!`, 400)
  //     );
  //   }
  // });
  for (let item of items) {
    const queryItem = `SELECT * FROM Batches WHERE batchNumber='${item.batchNumber}' AND item='${item.item}'`;
    const dbItems = await pool.request().query(queryItem);
    if (dbItems.recordset.length === 0) {
      item.flag = true;
      req.flag = true;
    }
  }
  items.forEach((item) => batchItems.push(item));
  req.batchItems = batchItems.filter((item) => !item.flag);
  // res.json({ items, batchItems });

  const query = `INSERT INTO StockReceipts 
  ( 
  
    purchaseOrderNumber,
    createdBy,
    dateCreated,
    dateModified,
    stockReceiptNumber,
    items,
    deliveredBy,
    receivedBy,
    flag
  ) 
Output Inserted.stockReceiptNumber
  values (
    @purchaseOrderNumber,
    @createdBy,
    @dateCreated,
    @dateModified,
    @stockReceiptNumber,
    @items,
    @deliveredBy,
    @receivedBy,
    @flag
  ) `;

  const sqlStock = await pool
    .request()
    .input("purchaseOrderNumber", mssql.VarChar, purchaseOrderNumber)
    .input("deliveredBy", mssql.VarChar, deliveredBy)
    .input("receivedBy", mssql.VarChar, receivedBy)
    .input("flag", mssql.Bit, req.flag ? true : false)
    .input("createdBy", mssql.VarChar, req.user.userId)
    .input("dateCreated", mssql.DateTimeOffset, new Date().toISOString())
    .input("stockReceiptNumber", mssql.VarChar, `S${new Date().getTime()}`)
    .input("dateModified", mssql.DateTimeOffset, new Date().toISOString())
    .input("items", mssql.NVarChar, JSON.stringify(items))
    .query(query);

  req.stockReceiptNumber = sqlStock.recordset[0].stockReceiptNumber;
  req.items = items;
  // req.stockName = stockName;
  // console.log(items);
  next();
});

// --------------------------

// });
exports.updateStock = catchAsync(async (req, res, next) => {
  const queryUser = `SELECT * FROM StockReceipts WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryUser);
  if (sql.recordset.length === 0) {
    return next(new AppError("Stock not found!", 404));
  }
  let { purchaseOrderNumber, items, deliveredBy, receivedBy } = req.body;

  if (!purchaseOrderNumber || !deliveredBy || !receivedBy || !items) {
    return next(new AppError(`Provide all stock details!`, 400));
  }

  const queryUniqueOrderNumber = `SELECT * FROM StockReceipts WHERE  purchaseOrderNumber='${purchaseOrderNumber}' AND id<>${req.params.id} `;
  const sqlOrder = await pool.request().query(queryUniqueOrderNumber);
  if (sqlOrder.recordset.length > 0) {
    return next(
      new AppError(
        `The PurchaseOrderNumber '${purchaseOrderNumber}' is already received!`,
        400
      )
    );
  }

  // validating purchase orders
  const queryPurchaseOrderNumber = `SELECT * FROM PurchaseOrders WHERE  purchaseOrderNumber='${purchaseOrderNumber}' `;
  const sqlPurchase = await pool.request().query(queryPurchaseOrderNumber);
  if (sqlPurchase.recordset.length === 0) {
    return next(new AppError(`The PurchaseOrderNumber is not valid!`, 400));
  }

  const query = `UPDATE StockReceipts SET 
  purchaseOrderNumber=@purchaseOrderNumber,
  dateModified=@dateModified,
  updatedBy=@updatedBy,
  deliveredBy=@deliveredBy,
  receivedBy=@receivedBy,
  items=@items
  WHERE  id=${req.params.id}`;

  await pool
    .request()
    .input("purchaseOrderNumber", mssql.VarChar, purchaseOrderNumber)
    .input("deliveredBy", mssql.VarChar, deliveredBy)
    .input("receivedBy", mssql.VarChar, receivedBy)
    .input("updatedBy", mssql.VarChar, req.user.userId)
    .input("dateModified", mssql.DateTimeOffset, new Date().toISOString())
    .input("items", mssql.NVarChar, JSON.stringify(items))
    .query(query);

  res.status(200).json({
    status: "Success",
    message: "Stock Updated!",
  });
});
exports.deleteStock = catchAsync(async (req, res, next) => {
  const queryCategory = `SELECT * FROM StockReceipts WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryCategory);
  if (sql.recordset.length === 0) {
    return next(new AppError("Stock not found!", 404));
  }

  const query = `DELETE FROM StockReceipts WHERE  id=${req.params.id}`;

  await pool.request().query(query);
  res.status(200).json({
    status: "Success",
    message: "Stock Deleted!",
  });
});
exports.getStocks = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM StockReceipts`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("No Stocks yet!", 404));
  }
  //   const products = sql.recordset;
  sql.recordset.forEach((stock) => {
    // console.log(JSON.parse(item.initialStockContent));
    stock.items = JSON.parse(stock.items);
  });
  res.status(200).json(sql.recordset);
});
exports.getStock = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM StockReceipts WHERE id=${req.params.id}`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("Stock Not found!", 404));
  }
  const stock = sql.recordset[0];
  //   converting opening stock to a proper object
  stock.batches = JSON.parse(stock.batches);
  res.status(200).json({
    status: "Success",
    stock,
  });
});

exports.stocksByCategory = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM StockReceipts WHERE categoryId='${req.categoryId}'`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("No Stocks by that category yet!", 404));
  }
  sql.recordset.forEach((stock) => {
    stock.batches = JSON.parse(stock.batches);
  });
  res.status(200).json(sql.recordset);
});
exports.stocksByCreatedDate = catchAsync(async (req, res, next) => {
  if (!new Date(req.params.date).getTime()) {
    return next(new AppError("Enter a valid date!", 400));
  }
  const query = `SELECT * FROM StockReceipts WHERE dateCreated>${new Date(
    req.params.date
  ).getTime()}`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("No Stock Created on that date yet!", 404));
  }
  sql.recordset.forEach((stock) => {
    stock.batches = JSON.parse(stock.batches);
  });
  res.status(200).json(sql.recordset);
});
exports.getStockByName = catchAsync(async (req, res, next) => {
  if (req.body.stock) {
    const queryStock = `SELECT id FROM StockReceipts WHERE  stockName='${req.body.stock.toLowerCase()}' `;
    const sqlCat = await pool.request().query(queryStock);
    if (sqlCat.recordset.length === 0) {
      return next(
        new AppError(
          `Stock: '(${req.body.stock.toLowerCase()})' doesn't exist!`,
          400
        )
      );
    }
    req.stockId = sqlCat.recordset[0].id;
    return next();
  }
  return next(
    new AppError(`Stock in which the item comes from is required!`, 400)
  );
});

// exports.stocksByExpiryDate = catchAsync(async (req, res, next) => {
//   if (!new Date(req.params.date).getTime()) {
//     return next(new AppError("Enter a valid date!", 400));
//   }
//   const query = `SELECT * FROM StockReceipts WHERE expiryDate<=${new Date(
//     req.params.date
//   ).getTime()}`;
//   const sql = await pool.request().query(query);
//   if (sql.recordset.length === 0) {
//     return next(new AppError("No Stocks yet!", 404));
//   }
//   sql.recordset.forEach((item) => {
//     //   converting opening stock to a proper object
//     // item.currentStockContent = JSON.parse(item.currentStockContent);
//     // item.initialStockContent = JSON.parse(item.initialStockContent);
//     item.expiryDate = new Date(Number(item.expiryDate));
//   });
//   const expiredFood = sql.recordset.filter((item) => item.category === "food");
//   if (expiredFood.length === 0) {
//     return next(new AppError("No Expired food on that date yet!", 404));
//   }
//   res.status(200).json(expiredFood);
// });
