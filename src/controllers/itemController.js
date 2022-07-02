const fs = require("fs");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const { pool, mssql } = require("../db/mssql");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.resizeItemPhoto = async (req, res, next) => {
  if (!req.file) {
    req.file = {};
    const promise = fs.promises.readFile(
      path.join(__dirname, "../../public/img/Item/default-Item-image.png")
    );
    req.file.buffer = await Promise.resolve(promise);
  }

  req.buffer = await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toBuffer();
  req.prodImg = req.buffer.toString("base64");

  next();
};
exports.uploadItemPhoto = upload.single("photo");

exports.addItemManual = catchAsync(async (req, res, next) => {
  // adding them to db
  const {
    batchName,
    itemName,
    description,
    brand,
    sellingPrice,
    image = "",
  } = req.body;

  if (
    !batchName ||
    !itemName ||
    !description ||
    !brand ||
    !Number(sellingPrice) > 0
  ) {
    return next(new AppError(`Provide all Item details!`, 400));
  }

  const querybatchName = ` SELECT * FROM Batches WHERE batchName='${batchName.toLowerCase()}'`;
  const sqlQuerybatchName = await pool.request().query(querybatchName);
  if (sqlQuerybatchName.recordset.length === 0) {
    return next(new AppError("There's no batch with that name!", 400));
  }
  // console.log("batch size", sqlQuerybatchName.recordset[0].batchSize);
  // const batchSize = sqlQuerybatchName.recordset[0].batchSize;
  // const batchNumber = sqlQuerybatchName.recordset[0].batchNumber;
  const { batchNumber, batchOrigin, warehouseId, supplierId, categoryId } =
    sqlQuerybatchName.recordset[0];

  const noBarcodeItems = `SELECT COUNT(*) AS noBarcodeItems FROM Items WHERE barcode='nobarcode' AND batchNumber='${batchNumber}'`;
  const sqlNoBarcodeItems = await pool.request().query(noBarcodeItems);
  // console.log(sqlNoBarcodeItems.recordset[0].noBarcodeItems);
  const itemsWithNoBarcode = sqlNoBarcodeItems.recordset[0].noBarcodeItems;
  if (itemsWithNoBarcode > 0) {
    return next(
      new AppError(`Item to be ordered in this batch already created!!`, 400)
    );
  }

  const query = `INSERT INTO Items 
  ( 
    item,
    barcode,
    categoryId,
    itemImage,
    description,
    createdBy,
    dateCreated,
    dateModified,
    supplierId,
    warehouseId,
    brand,
    origin,
    batchNumber,
    sellingPrice,
    status,
    batchName
  ) 
  values (
  
    @item,
    @barcode,
    @categoryId,
    @itemImage,
    @description,
    @createdBy,
    @dateCreated,
    @dateModified,
    @supplierId,
    @warehouseId,
    @brand,
    @origin,
    @batchNumber,
    @sellingPrice,
    @status,
    @batchName
  ) `;

  await pool
    .request()
    .input("item", mssql.VarChar, itemName)
    .input("barcode", mssql.VarChar, "nobarcode")
    .input("categoryId", mssql.VarChar, categoryId)
    .input("itemImage", mssql.VarChar, image)
    .input("description", mssql.NVarChar, description)
    .input("createdBy", mssql.VarChar, req.user.userId)
    .input("dateCreated", mssql.DateTimeOffset, new Date().getTime())
    .input("dateModified", mssql.DateTimeOffset, new Date().toISOString())
    .input("supplierId", mssql.VarChar, supplierId)
    .input("warehouseId", mssql.VarChar, warehouseId)
    .input("brand", mssql.VarChar, brand)
    .input("batchNumber", mssql.VarChar, batchNumber)
    .input("batchName", mssql.VarChar, batchName)
    .input("origin", mssql.VarChar, batchOrigin)
    .input("status", mssql.Bit, 1)
    .input("sellingPrice", mssql.Float, sellingPrice)
    .query(query);

  res.status(201).json({
    success: true,
    message: `Item successfully created!`,
  });
});
exports.addItemAutoBatch = catchAsync(async (req, res, next) => {
  // Checking if batches have items
  // req.batches.forEach(async (batch, index) => {
  const queryItem = `SELECT TOP 1 * FROM Items WHERE batchName='${req.batchName}'`;
  const sqlItem = await pool.request().query(queryItem);
  if (sqlItem.recordset.length === 0) {
    return next(new AppError("There are no items for this batch yet!", 400));
  }
  const {
    item,
    brand,
    categoryId,
    supplierId,
    warehouseId,
    itemImage: image,
    description,
    sellingPrice,
    batchNumber,
    batchName,
  } = sqlItem.recordset[0];

  // itemsToBe.push(batchQuantity);
  const itemsToCreate = Array.from(Array(req.batchQuantity));
  // -----------------------------------------------------------------
  // const queryNoOfItems = `SELECT COUNT(*) AS itemCount FROM Items WHERE batchNumber='${batchNumber}'`;
  // const sqlNoOfItems = await pool.request().query(queryNoOfItems);
  // ----------------------------------------
  itemsToCreate.forEach(async () => {
    const uniq = Math.random().toFixed(3).split(".")[1];
    const query = `INSERT INTO Items 
  ( 
    item,
    barcode,
    categoryId,
    createdBy,
    dateCreated,
    dateModified,
    supplierId,
    warehouseId,
    origin,
    status,
    sold,
    sellingPrice,
    batchNumber,
    batchName,
    description
  )

  values (
  

    @item,
    @barcode,
    @categoryId,
    @createdBy,
    @dateCreated,
    @dateModified,
    @supplierId,
    @warehouseId,
    @origin,
    @status,
    @sold,
    @sellingPrice,
    @batchNumber,
    @batchName,
    @description
  ) `;

    await pool
      .request()
      .input("item", mssql.VarChar, item)
      .input(
        "barcode",
        mssql.VarChar,
        new Date().getTime().toString().slice(3) + uniq
      )
      .input("categoryId", mssql.VarChar, categoryId)
      .input("itemImage", mssql.VarChar, image)
      .input("description", mssql.NVarChar, description)
      .input("createdBy", mssql.VarChar, req.user.userId)
      .input("dateCreated", mssql.DateTimeOffset, new Date().getTime())
      .input("dateModified", mssql.DateTimeOffset, new Date().toISOString())
      .input("supplierId", mssql.VarChar, req.supplierId)
      .input("warehouseId", mssql.VarChar, req.warehouseId)
      .input("brand", mssql.VarChar, brand)
      .input("origin", mssql.VarChar, req.origin)
      .input("status", mssql.Bit, 1)
      .input("sold", mssql.Bit, 0)
      .input("sellingPrice", mssql.Float, sellingPrice)
      .input("batchNumber", mssql.VarChar, batchNumber)
      .input("batchName", mssql.VarChar, batchName)
      .query(query);

    // --------------------------
  });
  // const allItems = itemsToBe.reduce((sum, current) => sum + current, 0);
  // console.log(allItems);
  res.status(201).json({
    success: true,
    message: `Batch Updated with: ${req.batchQuantity} item(s) Added!`,
  });
  // });
});
exports.addItemAuto = catchAsync(async (req, res, next) => {
  let itemsToBe = [];

  let itemsToBeCreatedArr = [];

  // for (const item of req.items) {
  for (const itemDb of req.batchItems) {
    // if (itemDb.item === item.item) {
    itemsToBe.push(itemDb.quantity);
    itemsToBeCreatedArr.push(Array(itemDb.quantity).fill(itemDb));
    // }
  }

  const allItems = itemsToBe.reduce(
    (sum, current) => Number(sum) + Number(current),
    0
  );

  if (itemsToBeCreatedArr.length > 0) {
    for (const numItemsArr of itemsToBeCreatedArr) {
      numItemsArr.forEach(async (item) => {
        const uniq = Math.random().toFixed(3).split(".")[1];
        const query = `INSERT INTO Items 
    ( 
      barcode,
      createdBy,
      dateCreated,
      dateModified,
      status,
      sold,
      batchNumber
    )
  
    values (
    
  
      @barcode,
      @createdBy,
      @dateCreated,
      @dateModified,
      @status,
      @sold,   
      @batchNumber
    ) `;

        await pool
          .request()
          .input(
            "barcode",
            mssql.VarChar,
            new Date().getTime().toString().slice(3) + uniq
          )
          .input("createdBy", mssql.VarChar, req.user.userId)
          .input("dateCreated", mssql.DateTimeOffset, new Date().toISOString())
          .input("dateModified", mssql.DateTimeOffset, new Date().toISOString())
          .input("status", mssql.Bit, 1)
          .input("sold", mssql.Bit, 0)
          .input("batchNumber", mssql.VarChar, item.batchNumber)
          .query(query);

        // --------------------------
      });
    }
  }

  // console.log(allItems);
  res.status(201).json({
    success: true,
    message: `${allItems} item(s) successfully created!`,
  });
});

exports.updateItem = catchAsync(async (req, res, next) => {
  const queryItem = `SELECT * FROM Items WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryItem);
  if (sql.recordset.length === 0) {
    return next(new AppError("Item not found!", 404));
  }
  const dbImg = sql.recordset[0].itemImage;

  // -----------------------------

  const {
    itemName,
    description,
    itemOrigin = "",
    brand = "",
    image = dbImg,
    sellingPrice,
  } = req.body;

  const query = `UPDATE Items SET 
  item=@item,
  itemImage=@itemImage,
  description=@description,
  dateModified=@dateModified,
  warehouseId=@warehouseId,
  brand=@brand,
  origin=@origin,
  sellingPrice=@sellingPrice,
  updatedBy=@updatedBy
  WHERE  id=${req.params.id}`;

  await pool
    .request()
    .input("item", mssql.VarChar, itemName)
    .input("itemImage", mssql.VarChar, image)
    .input("description", mssql.NVarChar, description)
    .input("dateModified", mssql.DateTimeOffset, new Date().toISOString())
    .input("warehouseId", mssql.Int, req.warehouseId)
    .input("brand", mssql.VarChar, brand)
    .input("origin", mssql.VarChar, itemOrigin)
    .input("status", mssql.Bit, 1)
    .input("sellingPrice", mssql.Float, sellingPrice)
    .input("updatedBy", mssql.VarChar, req.user.userId)
    .query(query);

  res.status(200).json({
    status: "Success",
    message: "Item Updated!",
  });
});
exports.deleteItem = catchAsync(async (req, res, next) => {
  const queryItem = `SELECT * FROM Items WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryItem);
  if (sql.recordset.length === 0) {
    return next(new AppError("Item not found!", 404));
  }

  const query = `DELETE FROM Items  WHERE  id=${req.params.id}`;

  await pool.request().query(query);
  res.status(200).json({
    status: "Success",
    message: "Item Deleted!",
  });
});
exports.getItems = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM Items WHERE status=1`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("No Items yet!", 404));
  }

  res.status(200).json(sql.recordset);
});
exports.getItemsPrint = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM Items WHERE status=1`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("No Items yet!", 404));
  }

  // res.status(200).json(sql.recordset);
  req.itemsPrint = sql.recordset;
  next();
});

exports.getItemsWithNoBarcodes = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM Items WHERE barcode='nobarcode'`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("All items have been ordered!", 404));
  }

  res.status(200).json(sql.recordset);
});
exports.getItemsWithNoBarcodesBatch = catchAsync(async (req, res, next) => {
  let { items } = req.body;
  for (const item of items) {
    const batchName = item.batchName ? item.batchName : item.item;
    console.log("Batch", item.item);
    const query = `SELECT * FROM Items WHERE barcode='nobarcode' AND batchName='${item.item.toLowerCase()}'`;
    const sql = await pool.request().query(query);
    if (sql.recordset.length === 0) {
      return next(new AppError("Each Batch should have an item!", 404));
    }
  }
  next();
});

exports.getItem = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM Items WHERE id=${req.params.id}`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("Item Not found!", 404));
  }
  const Item = sql.recordset[0];
  //   converting opening stock to a proper object
  Item.expiryDate = new Date(Number(Item.expiryDate));
  res.status(200).json({
    status: "Success",
    Item,
  });
});
exports.ItemsExpiryDate = catchAsync(async (req, res, next) => {
  if (!new Date(req.params.date).getTime()) {
    return next(new AppError("Enter a valid date!", 400));
  }
  const query = `SELECT Items.item,Items.barcode, Items.description,StockReceipts.expiryDate FROM Items JOIN StockReceipts ON
  items.barcode=StockReceipts.barcode `;

  const sql = await pool.request().query(query);
  console.log(sql);
  if (sql.recordset.length === 0) {
    return next(new AppError("No Expired Items yet!", 404));
  }
  // sql.recordset.forEach((item) => {
  //   item.itemAttributes = JSON.parse(item.itemAttributes);
  // });
  const expiredItems = sql.recordset.filter(
    (item) =>
      item.expiryDate > 0 &&
      Number(item.expiryDate) <= new Date(req.params.date).getTime()
  );
  if (expiredItems.length === 0) {
    return next(
      new AppError("No Expired food on display from that date yet!", 404)
    );
  }
  res.status(200).json(expiredItems);
});
exports.ItemsByCategory = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM Items WHERE category='${req.params.category}'`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("No Items For That Category yet!", 404));
  }
  sql.recordset.forEach((item) => {
    // item.itemAttributes = JSON.parse(item.itemAttributes);
    item.expiryDate = new Date(Number(item.expiryDate));
  });
  res.status(200).json(sql.recordset);
});
exports.ItemByBarcode = catchAsync(async (req, res, next) => {
  const barcode = req.body.barcode;
  if (!barcode) {
    return next(new AppError("You must provide a barcode!", 404));
  }
  const query = `SELECT 
  ITEMS.id,ITEMS.barcode,ITEMS.lastTimeScanned,ITEMS.operationSoldOn,
  ITEMS.returned,ITEMS.sold,ITEMS.status,ITEMS.updatedBy,ITEMS.dateSold,
  ITEMS.dateReturned,ITEMS.dateModified,ITEMS.dateCreated,ITEMS.createdBy,
  ITEMS.batchNumber,BATCHES.batchOrigin,BATCHES.brand,BATCHES.categoryId,BATCHES.itemImage, 
  BATCHES.supplierId,BATCHES.unitBuyingPrice,BATCHES.unitSellingPrice FROM BATCHES JOIN ITEMS 
  ON BATCHES.batchNumber = Items.batchNumber
  WHERE Items.barcode = '${barcode}' AND status=1 AND sold=0`;

  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(
      new AppError("No Item with That Barcode or item already sold!", 404)
    );
  }
  req.item = sql.recordset[0];
  // res.status(200).json(sql.recordset[0]);
  next();
});
exports.soldItemByBarcode = catchAsync(async (req, res, next) => {
  const barcode = req.body.barcode;
  if (!barcode) {
    return next(new AppError("You must provide a barcode!", 404));
  }
  const query = `SELECT * FROM Items WHERE barcode='${barcode}' AND status=1 AND sold=1`;

  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("No Item with That Barcode sold!", 404));
  }
  req.item = sql.recordset[0];
  // res.status(200).json(sql.recordset[0]);
  next();
});
exports.ItemByBatchName = catchAsync(async (req, res, next) => {
  const batchName = req.params.batchName
    ? req.params.batchName
    : req.body.batchName;
  if (!batchName) {
    return next(new AppError("You must provide a batchName!", 404));
  }

  const query = `SELECT * FROM Items WHERE batchName='${batchName}'`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("No Item with That batchName!", 404));
  }
  const batchItems = sql.recordset;
  res.status(200).json({
    success: true,
    batchItems,
  });
});
exports.scanItemBarcode = catchAsync(async (req, res, next) => {
  const barcode = req.params.barcode;
  if (!barcode) {
    return next(new AppError("You must provide a barcode!", 404));
  }
  const query = `SELECT 
  ITEMS.id,ITEMS.barcode,ITEMS.lastTimeScanned,ITEMS.operationSoldOn,
  ITEMS.returned,ITEMS.sold,ITEMS.status,ITEMS.updatedBy,ITEMS.dateSold,
  ITEMS.dateReturned,ITEMS.dateModified,ITEMS.dateCreated,ITEMS.createdBy,
  ITEMS.batchNumber,BATCHES.batchOrigin,BATCHES.brand,BATCHES.categoryId,BATCHES.itemImage, 
  BATCHES.supplierId,BATCHES.unitBuyingPrice,BATCHES.unitSellingPrice FROM BATCHES JOIN ITEMS 
  ON BATCHES.batchNumber = Items.batchNumber
  WHERE Items.barcode = '${barcode}' AND status=1 AND sold=0`;

  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(
      new AppError("No Item with That Barcode or item already sold!", 404)
    );
  }
  const queryScan = `UPDATE Items SET lastTimeScanned='${new Date().toISOString()}' WHERE barcode='${barcode}'`;
  await pool.request().query(queryScan);

  res.status(200).json(sql.recordset[0]);
});
exports.ItemsCreatedDate = catchAsync(async (req, res, next) => {
  if (!new Date(req.params.date).getTime()) {
    return next(new AppError("Enter a valid date!", 400));
  }
  const query = `SELECT * FROM Items `;

  // WHERE dateCreated>${new Date(
  //   req.params.date
  // ).getTime()}
  const sql = await pool.request().query(query);

  // sql.recordset.forEach((item) => {
  //   item.itemAttributes = JSON.parse(item.itemAttributes);
  // });
  const latestItems = sql.recordset.filter(
    (item) => Number(item.dateCreated) >= new Date(req.params.date).getTime()
  );
  if (latestItems.length === 0) {
    return next(new AppError("No Items Created From that date yet!", 404));
  }
  res.status(200).json(latestItems);
});

exports.soldItems = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM Items WHERE sold=1 AND barcode<>'nobarcode'`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("No Sold Items yet!", 404));
  }

  res.status(200).json(sql.recordset);
});
