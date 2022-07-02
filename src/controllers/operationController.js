const { pool, mssql } = require("../db/mssql");
// const User = require('../models/user');
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.addOperation = catchAsync(async (req, res, next) => {
  const { operation } = req.body;

  if (!operation) {
    return next(new AppError(`Provide an Operation!`, 400));
  }
  // check if accessLevel or type already exist

  const queryOperation = `SELECT * FROM saleOperations WHERE  operationType='${operation.toLowerCase()}' `;
  const sqlCat = await pool.request().query(queryOperation);
  if (sqlCat.recordset.length > 0) {
    return next(
      new AppError(`Operation: '(${operation})' already exist!`, 400)
    );
  }

  const query = `INSERT INTO saleOperations 
  ( 
    operationType,
    createdBy,
    dateCreated,
    dateModified
  ) 
  Output Inserted.id
  values (
  
    @operationType,
    @createdBy,
    @dateCreated,
    @dateModified
  ) `;

  sql = await pool
    .request()
    .input("operationType", mssql.VarChar, operation.toLowerCase())
    .input("createdBy", mssql.VarChar, req.user.userId)
    .input("dateCreated", mssql.Date, new Date().toISOString())
    .input("dateModified", mssql.Date, new Date().toISOString())
    .query(query);

  // --------------------------

  res.status(201).json({
    success: true,
    message: "Operation successfully added!",
  });
});
exports.updateOperation = catchAsync(async (req, res, next) => {
  const queryUser = `SELECT * FROM saleOperations WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryUser);
  if (sql.recordset.length === 0) {
    return next(new AppError("Operation not found!", 404));
  }
  // console.log(req.body);
  const { operation } = req.body;
  if (!operation) {
    return next(new AppError(`Provide an Operation`, 400));
  }

  // check if what is updated is already there
  const queryOperation = `SELECT * FROM saleOperations WHERE operationType='${operation}'`;
  const sqlCat = await pool.request().query(queryOperation);
  if (sqlCat.recordset.length > 0) {
    return next(new AppError(`Operation:('${operation}') already exist!`, 400));
  }

  const query = `UPDATE saleOperations SET 
  operationType=@operationType,
  updatedBy=@updatedBy,
  dateModified=@dateModified
  WHERE  id=${req.params.id}`;

  await pool
    .request()
    .input("operationType", mssql.VarChar, operation.toLowerCase())
    .input("updatedBy", mssql.VarChar, req.user.userId)
    .input("dateModified", mssql.VarChar, new Date().toISOString())
    .query(query);

  res.status(200).json({
    status: "Success",
    message: "Operation Updated!",
  });
});
exports.deleteOperation = catchAsync(async (req, res, next) => {
  const queryOperation = `SELECT * FROM saleOperations WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryOperation);
  if (sql.recordset.length === 0) {
    return next(new AppError("Operation not found!", 404));
  }

  const query = `DELETE FROM saleOperations WHERE  id=${req.params.id}`;

  await pool.request().query(query);

  res.status(200).json({
    status: "Success",
    message: "Operation Deleted!",
  });
});
exports.getOperations = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM saleOperations`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("No saleOperations yet!", 404));
  }
  const saleOperations = sql.recordset;
  res.status(200).json({
    status: "Success",
    saleOperations,
  });
});
exports.getOperation = catchAsync(async (req, res, next) => {
  // console.log(req.body.OperationId);
  // const query = `SELECT * FROM saleOperations WHERE id=${req.params.id}`;
  const query = `SELECT * FROM saleOperations WHERE id=${req.params.id}`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(
      new AppError("Operation Not found! Add Operation First!!", 404)
    );
  }
  const operation = sql.recordset;
  res.status(200).json({
    status: "Success",
    operation,
  });
});
exports.getOperationByName = catchAsync(async (req, res, next) => {
  if (req.body.operationType) {
    const queryOperation = `SELECT id FROM saleOperations WHERE  operationType='${req.body.operationType.toLowerCase()}' `;
    const sqlOper = await pool.request().query(queryOperation);
    if (sqlOper.recordset.length === 0) {
      return next(
        new AppError(
          `Operation: '(${req.body.operationType.toLowerCase()})' doesn't exist!`,
          400
        )
      );
    }
    req.operationId = sqlOper.recordset[0].id;
    return next();
  }
  return next(new AppError(`Provide an operation!`, 400));
});
