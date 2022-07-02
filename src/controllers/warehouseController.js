const { pool, mssql } = require("../db/mssql");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.addWarehouse = catchAsync(async (req, res, next) => {
  const { warehouseName, warehouseDetails } = req.body;

  if (!warehouseName || !warehouseDetails) {
    return next(
      new AppError(`Provide warehouseName and warehouseDetails!`, 400)
    );
  }

  const queryWarehouseName = `SELECT * FROM Warehouses WHERE  warehouseName='${warehouseName.toLowerCase()}' `;
  const sqlCat = await pool.request().query(queryWarehouseName);
  if (sqlCat.recordset.length > 0) {
    return next(
      new AppError(
        `Warehouse Name: '(${warehouseName})' already exist!Choose a different name!`,
        400
      )
    );
  }

  const query = `INSERT INTO Warehouses 
  ( 
    warehouseName,
    warehouseDetails,
    createdBy,
    dateCreated,
    dateModified
  ) 
  values (
  
    @warehouseName,
    @warehouseDetails,
    @createdBy,
    @dateCreated,
    @dateModified
  ) `;

  sql = await pool
    .request()
    .input("warehouseName", mssql.VarChar, warehouseName.toLowerCase())
    .input("warehouseDetails", mssql.NVarChar, JSON.stringify(warehouseDetails))
    .input("createdBy", mssql.VarChar, req.user.userId)
    .input("dateCreated", mssql.DateTimeOffset, new Date().toISOString())
    .input("dateModified", mssql.DateTimeOffset, new Date().toISOString())
    .query(query);

  // --------------------------

  res.status(201).json({
    success: true,
    message: "Warehouse successfully Added!",
  });
});
exports.updateWarehouse = catchAsync(async (req, res, next) => {
  const queryWarehouse = `SELECT * FROM Warehouses WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryWarehouse);
  if (sql.recordset.length === 0) {
    return next(new AppError("Warehouse not found!", 404));
  }
  const { warehouseName, warehouseDetails } = req.body;

  if (!warehouseName || !warehouseDetails) {
    return next(
      new AppError(`Provide warehouseName and warehouseDetails!`, 400)
    );
  }

  const query = `UPDATE Warehouses SET 
  warehouseName=@warehouseName,
  warehouseDetails=@warehouseDetails,
  updatedBy=@updatedBy,
  dateModified=@dateModified
  WHERE  id=${req.params.id}`;

  await pool
    .request()
    .input("warehouseName", mssql.VarChar, warehouseName.toLowerCase())
    .input("warehouseDetails", mssql.NVarChar, JSON.stringify(warehouseDetails))
    .input("updatedBy", mssql.VarChar, req.user.userId)
    .input("dateModified", mssql.Date, new Date().toISOString())
    .query(query);

  res.status(200).json({
    status: "Success",
    message: "Warehouse Updated!",
  });
});
exports.deleteWarehouse = catchAsync(async (req, res, next) => {
  const queryWarehouse = `SELECT * FROM Warehouses WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryWarehouse);
  if (sql.recordset.length === 0) {
    return next(new AppError("Warehouse not found!", 404));
  }

  const query = `DELETE FROM Warehouses WHERE  id=${req.params.id}`;

  await pool.request().query(query);

  res.status(200).json({
    status: "Success",
    message: "Warehouse Deleted!",
  });
});
exports.getWarehouses = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM Warehouses`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("No Warehouses yet!", 404));
  }

  //   const products = sql.recordset;
  sql.recordset.forEach((item) => {
    // console.log("")

    item.warehouseDetails = JSON.parse(item.warehouseDetails);
  });
  res.status(200).json(sql.recordset);
});
exports.getWarehouse = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM Warehouses WHERE id=${req.params.id}`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("Warehouse Not found!", 404));
  }

  //   converting warehouseDetails to a proper object
  const warehouse = sql.recordset[0];
  warehouse.warehouseDetails = JSON.parse(warehouse.warehouseDetails);
  res.status(200).json({
    status: "Success",
    warehouse,
  });
});

exports.getWarehouseByName = catchAsync(async (req, res, next) => {
  if (req.body.warehouse) {
    const queryWarehouse = `SELECT id FROM Warehouses WHERE  warehouseName='${req.body.warehouse.toLowerCase()}' `;
    const sqlCat = await pool.request().query(queryWarehouse);
    if (sqlCat.recordset.length === 0) {
      return next(
        new AppError(
          `Warehouse: '(${req.body.warehouse.toLowerCase()})' doesn't exist!`,
          400
        )
      );
    }
    req.warehouseId = sqlCat.recordset[0].id;
    return next();
  }
  return next(new AppError(`Provide a warehouse!`, 400));
});
