const { pool, mssql } = require("../db/mssql");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.addSale = catchAsync(async (req, res, next) => {
  const {
    customer,
    barcode,
    receivedBy,
    receiverPhone,
    price,
    operationType,
    customerType,
  } = req.body;

  if (
    !customer ||
    !barcode ||
    !receivedBy ||
    !receiverPhone ||
    !price ||
    !operationType ||
    !customerType
  ) {
    return next(new AppError(`Provide all Sale details!`, 400));
  }

  // checking if item is already sold
  const queryBarcode = `SELECT * FROM Sales WHERE barcode='${barcode}' AND returned<>null`;
  const sqlBar = await pool.request().query(queryBarcode);
  if (sqlBar.recordset.length > 0) {
    return next(new AppError("Item already Sold!", 400));
  }
  // Updating the item in items table
  const queryUpdateItem = `UPDATE Items SET
  sold=1,
  dateSold=${new Date().getTime()},
  operationSoldOn='${operationType}'
  WHERE barcode='${barcode}'
  `;
  await pool.request().query(queryUpdateItem);
  // Getting the item in batchNumber
  const queryItemBatchNumber = `SELECT batchNumber FROM  Items
  WHERE barcode='${barcode}'
  `;
  const sqlBatchNo = await pool.request().query(queryItemBatchNumber);
  const batchNumber = sqlBatchNo.recordset[0].batchNumber;
  // Deleting if the item had been returned
  const queryReturned = `DELETE FROM ReturnedItems WHERE barcode='${barcode}'`;
  await pool.request().query(queryReturned);

  // --------------------------checking batchQuantity if its 0

  // Selling the item
  const query = `INSERT INTO Sales 
  ( 
    customer,
    barcode,
    receivedBy,
    receiverPhone,
    price,
    operationType,
    customerType,
    dateCreated,
    dateModified,
    createdBy,
    status,
    batchNumber,
    receiptNumber
  ) 

  values (
  
    @customer,
    @barcode,
    @receivedBy,
    @receiverPhone,
    @price,
    @operationType,
    @customerType,
    @dateCreated,
    @dateModified,
    @createdBy,
    @status,
    @batchNumber,
    @receiptNumber
  ) `;

  await pool
    .request()
    .input("customer", mssql.VarChar, customer)
    .input("status", mssql.Int, 1)
    .input("barcode", mssql.VarChar, barcode)
    .input("receivedBy", mssql.VarChar, receivedBy)
    .input("receiverPhone", mssql.VarChar, receiverPhone)
    .input("price", mssql.Float, price)
    .input("createdBy", mssql.VarChar, req.user.userId)
    .input("dateCreated", mssql.DateTimeOffset, new Date().toISOString())
    .input("dateModified", mssql.DateTimeOffset, new Date().toISOString())
    .input("operationType", mssql.VarChar, operationType)
    .input("customerType", mssql.VarChar, customerType)
    .input("batchNumber", mssql.VarChar, batchNumber)
    .input("receiptNumber", mssql.VarChar, `R${new Date().getTime()}`)
    .query(query);

  return res.status(201).json({
    success: true,
    message: "Sale has been moved to pending state!",
  });
  // }
  // return next(new AppError("The batch doesn't have enough items!!", 400));
});
exports.updateSale = catchAsync(async (req, res, next) => {
  const querySale = `SELECT * FROM Sales WHERE id=${req.params.id} `;
  const sql = await pool.request().query(querySale);
  if (sql.recordset.length === 0) {
    return next(new AppError("Sale not found!", 404));
  }

  // -----------------------------

  const {
    customer,
    barcode,
    receivedBy,
    receiverPhone,
    price,
    operationType,
    customerType,
  } = req.body;

  if (
    !customer ||
    !barcode ||
    !receivedBy ||
    !receiverPhone ||
    !price ||
    !operationType ||
    !customerType
  ) {
    return next(new AppError(`Provide all Sale details!`, 400));
  }

  const query = `UPDATE Sales SET 
  customer=@customer,
  receivedBy=@receivedBy,
  receiverPhone=@receiverPhone,
  updatedBy=@updatedBy,
  dateModified=@dateModified,
  barcode=@barcode,
  price=@price,
  customerType=@customerType,
  operationType=@operationType
  WHERE  id=${req.params.id}`;

  await pool
    .request()
    .input("customer", mssql.VarChar, customer)
    .input("barcode", mssql.VarChar, barcode)
    .input("receivedBy", mssql.VarChar, receivedBy)
    .input("receiverPhone", mssql.VarChar, receiverPhone)
    .input("price", mssql.Float, price)
    .input("updatedBy", mssql.VarChar, req.user.userId)
    .input("dateCreated", mssql.DateTimeOffset, new Date().toISOString())
    .input("dateModified", mssql.DateTimeOffset, new Date().toISOString())
    .input("operationType", mssql.VarChar, operationType)
    .input("customerType", mssql.VarChar, customerType)
    .query(query);

  res.status(200).json({
    status: "Success",
    message: "Sale Updated!",
  });
});
exports.modifySale = catchAsync(async (req, res, next) => {
  const querySale = `SELECT * FROM Sales WHERE barcode='${req.params.barcode}' `;
  const sql = await pool.request().query(querySale);
  if (sql.recordset.length === 0) {
    return next(new AppError("Sale not found!", 404));
  }
  const querySaleStatus = `SELECT status FROM Sales WHERE barcode='${req.params.barcode}' `;
  const sqlStat = await pool.request().query(querySaleStatus);
  const saleState = sqlStat.recordset[0].status;
  if (Number(saleState) === 2) {
    return next(new AppError("Sale has been approved!", 403));
  }

  // -----------------------------
  const queryBatchNumber = `SELECT batchNumber from Items WHERE barcode='${req.params.barcode}'`;
  const sqlBatch = await pool.request().query(queryBatchNumber);

  let { status } = req.body;
  if (!status) {
    return next(
      new AppError(`Provide a status for which the item should be in!`, 400)
    );
  }

  if (status == "pending" || status == "approved") {
    if (status === "pending") {
      status = 1;
    }
    if (status === "approved") {
      status = 2;
    }
    const query = `UPDATE Sales SET 
  status=@status
  WHERE  barcode='${req.params.barcode}'`;

    await pool.request().input("status", mssql.Int, status).query(query);

    return res.status(200).json({
      status: "Success",
      message: `Sale Approved!`,
    });
  }
  res.status(400).json({
    status: "Fail",
    message: `${status} is not appropriate!`,
  });
});
exports.deleteSale = catchAsync(async (req, res, next) => {
  // const querySale = `SELECT * FROM Sales WHERE id=${req.params.id} `;
  const querySale = `SELECT * FROM Sales WHERE (id=${req.body.saleId} AND status=1) `;
  const sql = await pool.request().query(querySale);
  if (sql.recordset.length === 0) {
    return next(new AppError("Sale not found!", 404));
  }

  // const query = `DELETE FROM Sales  WHERE  id=${req.params.id}`;
  const query = `UPDATE Sales SET status=0 WHERE  id=${req.body.saleId}`;

  await pool.request().query(query);
  // res.status(200).json({
  //   status: "Success",
  //   message: "Sale Deleted!",
  // });
  next();
});
exports.getSales = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM Sales `;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("No Sales yet!", 404));
  }

  res.status(200).json(sql.recordset);
});
exports.pendingSales = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM Sales WHERE status=1`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("No Pending Sales yet!", 404));
  }
  //   const Sales = sql.recordset;
  // sql.recordset.forEach((item) => {
  //   item.customerDetails = JSON.parse(item.customerDetails);
  // });
  res.status(200).json(sql.recordset);
});
exports.approvedSales = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM Sales WHERE status=2`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("No Approved Sales yet!", 404));
  }
  //   const Sales = sql.recordset;
  // sql.recordset.forEach((item) => {
  //   item.customerDetails = JSON.parse(item.customerDetails);
  // });
  res.status(200).json(sql.recordset);
});
exports.getSale = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM Sales WHERE id=${req.params.id} `;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("Sale Not found!", 404));
  }
  const sale = sql.recordset[0];
  //   converting opening stock to a proper object
  // sale.customerDetails = JSON.parse(sale.customerDetails);
  // req.itemId = sql.recordset[0].itemId;
  res.status(200).json({
    status: "Success",
    sale,
  });
});
exports.SalesExpiryDate = catchAsync(async (req, res, next) => {
  if (!new Date(req.params.date).getTime()) {
    return next(new AppError("Enter a valid date!", 400));
  }
  const query = `SELECT Sales.Sale,Sales.SaleAttributes,Sales.barcode, Sales.description,newStock.expiryDate FROM Sales JOIN newStock ON
  Sales.stockId=newStock.id `;

  const sql = await pool.request().query(query);
  console.log(sql);
  if (sql.recordset.length === 0) {
    return next(new AppError("No Expired Sales yet!", 404));
  }
  sql.recordset.forEach((Sale) => {
    Sale.SaleAttributes = JSON.parse(Sale.SaleAttributes);
  });
  const expiredSales = sql.recordset.filter(
    (Sale) =>
      Sale.expiryDate > 0 &&
      Number(Sale.expiryDate) <= new Date(req.params.date).getTime()
  );
  res.status(200).json(expiredSales);
});
exports.SalesByCategory = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM Sales WHERE categoryId=${req.params.category}`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("No Sales For That Category yet!", 404));
  }
  sql.recordset.forEach((Sale) => {
    Sale.SaleAttributes = JSON.parse(Sale.SaleAttributes);
    Sale.expiryDate = new Date(Number(Sale.expiryDate));
  });
  res.status(200).json(sql.recordset);
});
exports.saleByBarcode = catchAsync(async (req, res, next) => {
  const barcode = req.params.barcode ? req.params.barcode : req.body.barcode;
  if (!barcode) {
    return next(new AppError("You must provide a barcode!", 404));
  }

  const query = `SELECT receiptNumber FROM Sales WHERE barcode='${barcode}'`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("No Item Sold with That Barcode!", 404));
  }
  req.receiptNumber = sql.recordset[0].receiptNumber;
  // res.status(200).json(sql.recordset);
  next();
});
exports.SalesCreatedDate = catchAsync(async (req, res, next) => {
  if (!new Date(req.params.date).getTime()) {
    return next(new AppError("Enter a valid date!", 400));
  }
  const query = `SELECT * FROM Sales `;

  // WHERE dateCreated>${new Date(
  //   req.params.date
  // ).getTime()}
  const sql = await pool.request().query(query);

  // sql.recordset.forEach((Sale) => {
  //   Sale.SaleAttributes = JSON.parse(Sale.SaleAttributes);
  // });
  const latestSales = sql.recordset.filter(
    (Sale) => Number(Sale.dateCreated) >= new Date(req.params.date).getTime()
  );
  if (latestSales.length === 0) {
    return next(new AppError("No Sales Created From that date yet!", 404));
  }
  res.status(200).json(latestSales);
});
