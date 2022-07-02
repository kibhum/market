const { pool, mssql } = require("../db/mssql");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.addBatchManual = catchAsync(async (req, res, next) => {
  let {
    item,
    brand,
    batchOrigin,
    description,
    warehouse,
    unitBuyingPrice,
    unitSellingPrice,
    category,
    supplier,
    itemImage,
  } = req.body;

  if (
    !item ||
    !brand ||
    !batchOrigin ||
    !supplier ||
    !description ||
    !category ||
    !warehouse ||
    !itemImage ||
    !Number(unitBuyingPrice) > 0 ||
    !Number(unitSellingPrice) > 0
  ) {
    return next(new AppError(`Provide all batch details!`, 400));
  }
  // console.log("unitBuyingPrice", unitBuyingPrice);

  // Limiting batch names
  const querybatchName = `SELECT * FROM Batches WHERE  item='${item.toLowerCase()}' `;
  const sqlBat = await pool.request().query(querybatchName);
  if (sqlBat.recordset.length > 0) {
    return next(
      new AppError(
        `batch with name: '(${item})' already exist!Choose a different name!`,
        400
      )
    );
  }
  const query = `INSERT INTO Batches 
    ( 
      item,
      batchNumber,
      brand,
      batchOrigin,
      supplierId,
      categoryId,
      createdBy,
      dateCreated,
      dateModified,
      warehouseId,
      unitBuyingPrice,
      unitSellingPrice,
      itemImage,
      description
    ) 
Output Inserted.batchNumber
  
    values (
      @item,
      @batchNumber,
      @brand,
      @batchOrigin,
      @supplierId,
      @categoryId,
      @createdBy,
      @dateCreated,
      @dateModified,
      @warehouseId,
      @unitBuyingPrice,
      @unitSellingPrice,
      @itemImage,
      @description
    ) `;
  await pool
    .request()
    .input("item", mssql.VarChar, item.toLowerCase())
    .input("batchNumber", mssql.VarChar, `B${new Date().getTime()}`)
    .input("batchOrigin", mssql.VarChar, batchOrigin)
    .input("brand", mssql.VarChar, brand)
    .input("itemImage", mssql.VarChar, itemImage)
    .input("description", mssql.VarChar, description)
    .input("supplierId", mssql.Int, req.supplierId)
    .input("categoryId", mssql.Int, req.categoryId)
    .input("createdBy", mssql.VarChar, req.user.userId)
    .input("dateCreated", mssql.DateTimeOffset, new Date().toISOString())
    .input("dateModified", mssql.DateTimeOffset, new Date().toISOString())
    .input("warehouseId", mssql.Int, req.warehouseId)
    .input("unitBuyingPrice", mssql.Float, unitBuyingPrice)
    .input("unitSellingPrice", mssql.Float, unitSellingPrice)
    .query(query);
  // });
  // req.batchNumber = batchNumber;s

  // --------------------------
  // next();
  res.status(201).json({
    success: true,
    message: "batch successfully saved!",
  });
});

exports.addBatch = catchAsync(async (req, res, next) => {
  // Checking Valid Stock Numbers
  const querystockReceiptNumber = `SELECT * FROM StockReceipts WHERE stockReceiptNumber='${req.stockReceiptNumber}' `;
  const sqlstockReceiptNumber = await pool
    .request()
    .query(querystockReceiptNumber);
  if (sqlstockReceiptNumber.recordset.length === 0) {
    return next(new AppError(`Invalid Stock Number!`, 400));
  }
  // Limiting batch names
  const batchNumber = `B${new Date().getTime()}`;
  req.items.forEach((item) => {
    const uniq = Math.random().toFixed(3).split(".")[1];
    item.batchNumber = batchNumber + uniq;
  });
  req.items.forEach(async (item) => {
    const query = `INSERT INTO Batches 
    ( 
      batchName,
      batchNumber,
      batchOrigin,
      supplierId,
      categoryId,
      createdBy,
      dateCreated,
      dateModified,
      warehouseId,
      unitBuyingPrice,
      stockReceiptNumber,
      batchQuantity
    ) 
Output Inserted.batchNumber
  
    values (
    
      @batchName,
      @batchNumber,
      @batchOrigin,
      @supplierId,
      @categoryId,
      @createdBy,
      @dateCreated,
      @dateModified,
      @warehouseId,
      @unitBuyingPrice,
      @stockReceiptNumber,
      @batchQuantity
    ) `;
    await pool
      .request()
      .input("batchName", mssql.VarChar, item.item.toLowerCase())
      .input("batchNumber", mssql.VarChar, item.batchNumber)
      .input("batchOrigin", mssql.VarChar, req.origin)
      .input("supplierId", mssql.Int, req.supplierId)
      .input("categoryId", mssql.Int, req.categoryId)
      .input("batchQuantity", mssql.VarChar, item.quantity)
      .input("stockReceiptNumber", mssql.VarChar, req.stockReceiptNumber)
      .input("createdBy", mssql.VarChar, req.user.userId)
      .input("dateCreated", mssql.DateTimeOffset, new Date().toISOString())
      .input("dateModified", mssql.DateTimeOffset, new Date().toISOString())
      .input("warehouseId", mssql.Int, req.warehouseId)
      .input("unitBuyingPrice", mssql.Float, item.unitBuyingPrice)
      .query(query);
  });
  req.batchNumber = batchNumber;

  // --------------------------
  next();
  // res.status(201).json({
  //   success: true,
  //   message: "batch successfully saved!",
  // });
});
exports.updateBatchAuto = catchAsync(async (req, res, next) => {
  // Limiting batch names
  let batchNumbers = [];

  for (item of req.items) {
    const query = `UPDATE Batches SET 
  updatedBy=@updatedBy,
  dateModified=@dateModified,
  unitBuyingPrice=@unitBuyingPrice,
  unitSellingPrice=@unitSellingPrice
  OUTPUT INSERTED.batchNumber 
  WHERE item=@item`;

    const sql = await pool
      .request()
      .input("updatedBy", mssql.VarChar, req.user.userId)
      .input("dateModified", mssql.DateTimeOffset, new Date().toISOString())
      .input("item", mssql.VarChar, item.item)
      .input("unitBuyingPrice", mssql.Float, item.unitBuyingPrice)
      .input("unitSellingPrice", mssql.Float, item.unitSellingPrice)
      .input("stockReceiptNumber", mssql.VarChar, req.stockReceiptNumber)
      .query(query);
    const batchNum = sql.recordset[0].batchNumber;
    batchNumbers.push(batchNum);
    req.batchNumbers = Array.from(new Set(batchNumbers));
  }

  next();
});
exports.updateBatch = catchAsync(async (req, res, next) => {
  const queryUser = `SELECT * FROM Batches WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryUser);
  if (sql.recordset.length === 0) {
    return next(new AppError("batch not found!", 404));
  }
  let {
    item,
    brand,
    batchOrigin,
    description,
    warehouse,
    unitBuyingPrice,
    unitSellingPrice,
    category,
    supplier,
    itemImage,
  } = req.body;

  if (
    !item ||
    !brand ||
    !batchOrigin ||
    !supplier ||
    !description ||
    !category ||
    !warehouse ||
    !itemImage ||
    !Number(unitBuyingPrice) > 0 ||
    !Number(unitSellingPrice) > 0
  ) {
    return next(new AppError(`Provide all batch details!`, 400));
  }

  // Limiting batch names
  const querybatchName = `SELECT * FROM Batches WHERE item='${item.toLowerCase()}' AND id<>${
    req.params.id
  } `;
  const sqlBat = await pool.request().query(querybatchName);
  if (sqlBat.recordset.length > 0) {
    return next(
      new AppError(
        `batch with name: '(${item})' already exist!Choose a different name or Update the batch!`,
        400
      )
    );
  }

  const query = `UPDATE Batches SET 
  item=@item,
  batchOrigin=@batchOrigin,
  supplierId=@supplierId,
  categoryId=@categoryId,
  brand=@brand,
  description=@description,
  updatedBy=@updatedBy,
  dateModified=@dateModified,
  warehouseId=@warehouseId,
  itemImage=@itemImage,
  unitBuyingPrice=@unitBuyingPrice,
  unitSellingPrice=@unitSellingPrice
  WHERE  id=${req.params.id}`;

  await pool
    .request()
    .input("item", mssql.VarChar, item.toLowerCase())
    .input("batchOrigin", mssql.VarChar, batchOrigin)
    .input("brand", mssql.VarChar, brand)
    .input("description", mssql.VarChar, description)
    .input("supplierId", mssql.Int, req.supplierId)
    .input("itemImage", mssql.VarChar, itemImage)
    .input("categoryId", mssql.Int, req.categoryId)
    .input("updatedBy", mssql.VarChar, req.user.userId)
    .input("dateModified", mssql.DateTimeOffset, new Date().toISOString())
    .input("warehouseId", mssql.Int, req.warehouseId)
    .input("unitBuyingPrice", mssql.Float, unitBuyingPrice)
    .input("unitSellingPrice", mssql.Float, unitSellingPrice)
    .query(query);

  res.status(200).json({
    success: true,
    message: "Batch updated!",
  });
});
exports.updateBatchManual = catchAsync(async (req, res, next) => {
  const queryUser = `SELECT * FROM Batches WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryUser);
  if (sql.recordset.length === 0) {
    return next(new AppError("batch not found!", 404));
  }
  let {
    batchQuantity = 0,
    batchName,
    batchOrigin,
    description,
    warehouse,
    unitBuyingPrice,
    category,
    supplier,
  } = req.body;

  if (
    !batchName ||
    !batchOrigin ||
    !supplier ||
    !description ||
    !category ||
    !warehouse ||
    !unitBuyingPrice
  ) {
    return next(new AppError(`Provide all batch details!`, 400));
  }
  // Checking Valid Stock Numbers
  // const querystockReceiptNumber = `SELECT * FROM StockReceipts WHERE stockReceiptNumber='${stockReceiptNumber}' `;
  // const sqlstockReceiptNumber = await pool.request().query(querystockReceiptNumber);
  // if (sqlstockReceiptNumber.recordset.length === 0) {
  //   return next(new AppError(`Invalid Stock Number!`, 400));
  // }
  // Limiting batch names
  const querybatchName = `SELECT * FROM Batches WHERE (batchName='${batchName.toLowerCase()}' AND id<>${
    req.params.id
  })`;
  const sqlBat = await pool.request().query(querybatchName);
  if (sqlBat.recordset.length > 0) {
    return next(
      new AppError(
        `batch with name: '(${batchName})' already exist!Choose a different name or Update the batch!`,
        400
      )
    );
  }

  const query = `UPDATE Batches SET 
  batchName=@batchName,
  batchOrigin=@batchOrigin,
  supplierId=@supplierId,
  categoryId=@categoryId,
  batchQuantity=batchQuantity+@batchQuantity,
  description=@description,
  updatedBy=@updatedBy,
  dateModified=@dateModified,
  warehouseId=@warehouseId,
  unitBuyingPrice=@unitBuyingPrice
  WHERE  id=${req.params.id}`;

  await pool
    .request()
    .input("batchName", mssql.VarChar, batchName.toLowerCase())
    .input("batchOrigin", mssql.VarChar, batchOrigin)
    .input("supplierId", mssql.Int, req.supplierId)
    .input("categoryId", mssql.Int, req.categoryId)
    .input("description", mssql.VarChar, description)
    .input("batchQuantity", mssql.VarChar, batchQuantity)
    .input("updatedBy", mssql.VarChar, req.user.userId)
    .input("dateModified", mssql.DateTimeOffset, new Date().toISOString())
    .input("warehouseId", mssql.Int, req.warehouseId)
    .input("unitBuyingPrice", mssql.Float, unitBuyingPrice)
    .query(query);

  if (req.url.includes("modifyBatch")) {
    return res.status(200).json({
      success: true,
      message: "Batch updated!",
    });
  }
  req.batchName = batchName.toLowerCase();
  req.batchQuantity = batchQuantity;

  next();
});
exports.deleteBatch = catchAsync(async (req, res, next) => {
  const querybatch = `SELECT * FROM Batches WHERE id=${req.params.id} `;
  const sql = await pool.request().query(querybatch);
  if (sql.recordset.length === 0) {
    return next(new AppError("batch not found!", 404));
  }

  const query = `DELETE FROM Batches WHERE  id=${req.params.id}`;

  await pool.request().query(query);
  res.status(200).json({
    status: "Success",
    message: "batch Deleted!",
  });
});
exports.getBatches = catchAsync(async (req, res, next) => {
  const quer = `SELECT *,
  (SELECT COUNT(*)  FROM ITEMS WHERE
  ITEMS.batchNumber=Batches.batchNumber AND sold=0) AS quantity
  FROM BATCHES  `;
  const result = await pool.request().query(quer);

  res.status(200).json(result.recordset);
});
exports.getBatch = catchAsync(async (req, res, next) => {
  const query = `SELECT *,
  (SELECT COUNT(*)  FROM ITEMS WHERE
  ITEMS.batchNumber=Batches.batchNumber AND sold=0) AS quantity
  FROM BATCHES  WHERE id=${req.params.id}`;
  const sql = await pool.request().query(query);

  const batch = sql.recordset[0];

  res.status(200).json({
    status: "Success",
    batch,
  });
});
