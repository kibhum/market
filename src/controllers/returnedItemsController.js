const fs = require("fs");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const { pool, mssql } = require("../db/mssql");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.addItem = catchAsync(async (req, res, next) => {
  const { barcode, reason, warehouse, returnedBy } = req.body;

  if (!barcode || !reason || !warehouse || !returnedBy) {
    return next(new AppError(`Provide all Item details!`, 400));
  }

  // Updating the item in items table
  const queryUpdateItem = `UPDATE Items SET sold=0 WHERE barcode='${barcode}'
   `;
  await pool.request().query(queryUpdateItem);
  // Updating the item in items table
  const queryUpdateSales = `UPDATE Items SET returned=1 WHERE barcode='${barcode}'
   `;
  await pool.request().query(queryUpdateSales);
  // checking if item is already returned
  const queryBarcode = `SELECT * FROM ReturnedItems WHERE barcode='${barcode}'`;
  const sqlBar = await pool.request().query(queryBarcode);
  if (sqlBar.recordset.length > 0) {
    return next(new AppError("Item already Returned!", 400));
  }

  // Return the item
  const query = `INSERT INTO ReturnedItems 
  ( 
    barcode,
    reason,
    receivedBy,
    dateCreated,
    dateModified,
    warehouseId,
    status,
    returnedBy,
    receiptNumber
  ) 

  values (
  
    @barcode,
    @reason,
    @receivedBy,
    @dateCreated,
    @dateModified,
    @warehouseId,
    @status,
    @returnedBy,
    @receiptNumber
  ) `;

  await pool
    .request()
    .input("barcode", mssql.VarChar, barcode)
    .input("reason", mssql.VarChar, reason)
    .input("returnedBy", mssql.VarChar, returnedBy)
    .input("receivedBy", mssql.VarChar, req.user.userId)
    .input("dateCreated", mssql.DateTimeOffset, new Date().toISOString())
    .input("dateModified", mssql.DateTimeOffset, new Date().toISOString())
    .input("warehouseId", mssql.Int, req.warehouseId)
    .input("receiptNumber", mssql.VarChar, req.receiptNumber)
    .input("status", mssql.Int, 1)
    .query(query);

  // --------------------------

  res.status(201).json({
    success: true,
    message: "Item returned!",
  });
});
exports.updateItem = catchAsync(async (req, res, next) => {
  const queryItem = `SELECT * FROM ReturnedItems WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryItem);
  if (sql.recordset.length === 0) {
    return next(new AppError("Item not found!", 404));
  }

  // -----------------------------

  const { barcode, reason, warehouse, returnedBy } = req.body;

  if (!barcode || !reason || !warehouse || !returnedBy) {
    return next(new AppError(`Provide all Item details!`, 400));
  }

  const queryBar = `SELECT * FROM ReturnedItems WHERE barcode='${barcode}' AND id<>${req.params.id} `;
  const sqlBr = await pool.request().query(queryBar);
  if (sqlBr.recordset.length > 0) {
    return next(
      new AppError(
        `The barcode '${barcode}' is associated with a different sale!`,
        400
      )
    );
  }

  const query = `UPDATE ReturnedItems SET 
  barcode=@barcode,
  reason=@reason,
  updatedBy=@updatedBy,
  returnedBy=@returnedBy,
  warehouseId=@warehouseId,
  dateModified=@dateModified
  WHERE  id=${req.params.id}`;

  await pool
    .request()
    .input("reason", mssql.VarChar, reason)
    .input("barcode", mssql.VarChar, barcode)
    .input("returnedBy", mssql.VarChar, returnedBy)
    .input("receiptNumber", mssql.VarChar, req.receiptNumber)
    .input("updatedBy", mssql.VarChar, req.user.userId)
    .input("dateModified", mssql.DateTimeOffset, new Date().toISOString())
    .input("warehouseId", mssql.Int, req.warehouseId)
    .query(query);

  res.status(200).json({
    status: "Success",
    message: "Item Updated!",
  });
});
exports.deleteItem = catchAsync(async (req, res, next) => {
  const queryItem = `SELECT * FROM ReturnedItems WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryItem);
  if (sql.recordset.length === 0) {
    return next(new AppError("Item not found!", 404));
  }

  const query = `DELETE FROM ReturnedItems  WHERE  id=${req.params.id}`;

  await pool.request().query(query);
  res.status(200).json({
    status: "Success",
    message: "Item Deleted!",
  });
});
exports.getItems = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM ReturnedItems`;
  const sql = await pool.request().query(query);

  res.status(200).json(sql.recordset);
});
exports.getItem = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM ReturnedItems WHERE id=${req.params.id}`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("Item Not found!", 404));
  }
  const Item = sql.recordset[0];
  //   converting opening stock to a proper object
  //   Item.itemAttributes = JSON.parse(Item.itemAttributes);
  //   Item.expiryDate = new Date(Number(Item.expiryDate));
  res.status(200).json({
    status: "Success",
    Item,
  });
});

// exports.ReturnedItemsExpiryDate = catchAsync(async (req, res, next) => {
//   if (!new Date(req.params.date).getTime()) {
//     return next(new AppError("Enter a valid date!", 400));
//   }
//   const query = `SELECT ReturnedItems.item,ReturnedItems.itemAttributes,ReturnedItems.barcode, ReturnedItems.description,newStock.expiryDate FROM ReturnedItems JOIN newStock ON
//   ReturnedItems.stockId=newStock.id `;

//   const sql = await pool.request().query(query);
//   console.log(sql);
//   if (sql.recordset.length === 0) {
//     return next(new AppError("No Expired ReturnedItems yet!", 404));
//   }
//   sql.recordset.forEach((item) => {
//     item.itemAttributes = JSON.parse(item.itemAttributes);
//   });
//   const expiredReturnedItems = sql.recordset.filter(
//     (item) =>
//       item.expiryDate > 0 &&
//       Number(item.expiryDate) <= new Date(req.params.date).getTime()
//   );
//   res.status(200).json(expiredReturnedItems);
// });
exports.ItemsByCategory = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM ReturnedItems WHERE category='${req.params.category}'`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("No Returned Items For That Category yet!", 404));
  }
  sql.recordset.forEach((item) => {
    // item.itemAttributes = JSON.parse(item.itemAttributes);
    item.expiryDate = new Date(Number(item.expiryDate));
  });
  res.status(200).json(sql.recordset);
});
exports.ItemsReturnedDate = catchAsync(async (req, res, next) => {
  if (!new Date(req.params.date).getTime()) {
    return next(new AppError("Enter a valid date!", 400));
  }
  const query = `SELECT * FROM ReturnedItems `;

  const sql = await pool.request().query(query);

  // sql.recordset.forEach((item) => {
  //   item.itemAttributes = JSON.parse(item.itemAttributes);
  // });
  const latestReturnedItems = sql.recordset.filter(
    (item) => Number(item.dateCreated) >= new Date(req.params.date).getTime()
  );
  if (latestReturnedItems.length === 0) {
    return next(new AppError("No Returned Items From that date!", 404));
  }
  res.status(200).json(latestReturnedItems);
});
exports.modifyItem = catchAsync(async (req, res, next) => {
  const queryItem = `SELECT * FROM ReturnedItems WHERE barcode='${req.params.barcode}' `;
  const sql = await pool.request().query(queryItem);
  if (sql.recordset.length === 0) {
    return next(
      new AppError("Item not yet returned or the barcode is invalid!", 404)
    );
  }
  const queryReturnedItemstatus = `SELECT status FROM ReturnedItems WHERE barcode='${req.params.barcode}' `;
  const sqlStat = await pool.request().query(queryReturnedItemstatus);
  const ReturnedItemstate = sqlStat.recordset[0].status;
  if (Number(ReturnedItemstate) === 2) {
    return next(new AppError("Item has been approved to be returned!", 403));
  }

  // -----------------------------
  const queryBatchNumber = `SELECT batchNumber from Items WHERE barcode='${req.params.barcode}'`;
  const sqlBatch = await pool.request().query(queryBatchNumber);
  const batchNumber = sqlBatch.recordset[0].batchNumber;

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
    const query = `UPDATE ReturnedItems SET 
  status=@status
  WHERE  barcode='${req.params.barcode}'`;

    await pool.request().input("status", mssql.Int, status).query(query);

    return res.status(200).json({
      status: "Success",
      message: `Item has been Modified accordingly!`,
    });
  }
  res.status(400).json({
    status: "Fail",
    message: `${status} is not appropriate!`,
  });
});
exports.pendingReturnedItems = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM ReturnedItems WHERE status=1`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("No Pending Returned Items yet!", 404));
  }
  //   const Sales = sql.recordset;
  // sql.recordset.forEach((item) => {
  //   item.customerDetails = JSON.parse(item.customerDetails);
  // });
  res.status(200).json(sql.recordset);
});
exports.approvedReturnedItems = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM ReturnedItems WHERE status=2`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("No Approved Returned yet!", 404));
  }
  //   const Sales = sql.recordset;
  // sql.recordset.forEach((item) => {
  //   item.customerDetails = JSON.parse(item.customerDetails);
  // });
  res.status(200).json(sql.recordset);
});
