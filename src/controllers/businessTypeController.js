const { pool, mssql } = require("../db/mssql");
// const User = require('../models/user');
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.addBusinessType = catchAsync(async (req, res, next) => {
  const { businessType } = req.body;

  if (!businessType) {
    return next(new AppError(`Provide a BusinessType!`, 400));
  }
  // check if accessLevel or type already exist

  const queryBusinessType = `SELECT * FROM BusinessTypes WHERE  BusinessType='${businessType.toLowerCase()}' `;
  const sqlCat = await pool.request().query(queryBusinessType);
  if (sqlCat.recordset.length > 0) {
    return next(
      new AppError(`BusinessType: '(${businessType})' already exist!`, 400)
    );
  }

  const query = `INSERT INTO BusinessTypes 
  ( 
    businessType,
    createdBy,
    dateCreated,
    dateModified
  ) 
  Output Inserted.id
  values (
  
    @businessType,
    @createdBy,
    @dateCreated,
    @dateModified
  ) `;

  sql = await pool
    .request()
    .input("businessType", mssql.VarChar, businessType.toLowerCase())
    .input("createdBy", mssql.VarChar, req.user.userId)
    .input("dateCreated", mssql.Date, new Date().toISOString())
    .input("dateModified", mssql.Date, new Date().toISOString())
    .query(query);

  // --------------------------

  res.status(201).json({
    success: true,
    message: "BusinessType successfully added!",
  });
});
exports.updateBusinessType = catchAsync(async (req, res, next) => {
  const queryUser = `SELECT * FROM BusinessTypes WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryUser);
  if (sql.recordset.length === 0) {
    return next(new AppError("Business Type not found!", 404));
  }
  // console.log(req.body);
  const { businessType } = req.body;
  if (!businessType) {
    return next(new AppError(`Provide a BusinessType`, 400));
  }

  // check if what is updated is already there
  const queryBusinessType = `SELECT * FROM BusinessTypes WHERE BusinessType='${businessType}'`;
  const sqlCat = await pool.request().query(queryBusinessType);
  if (sqlCat.recordset.length > 0) {
    return next(
      new AppError(`BusinessType:('${businessType}') already exist!`, 400)
    );
  }

  const query = `UPDATE BusinessTypes SET 
  BusinessType=@BusinessType,
  updatedBy=@updatedBy,
  dateModified=@dateModified
  WHERE  id=${req.params.id}`;

  await pool
    .request()
    .input("businessType", mssql.VarChar, businessType.toLowerCase())
    .input("updatedBy", mssql.VarChar, req.user.userId)
    .input("dateModified", mssql.VarChar, new Date().toISOString())
    .query(query);

  res.status(200).json({
    status: "Success",
    message: "Business Type Updated!",
  });
});
exports.deleteBusinessType = catchAsync(async (req, res, next) => {
  const queryBusinessType = `SELECT * FROM BusinessTypes WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryBusinessType);
  if (sql.recordset.length === 0) {
    return next(new AppError("BusinessType not found!", 404));
  }

  const query = `DELETE FROM BusinessTypes WHERE  id=${req.params.id}`;

  await pool.request().query(query);

  res.status(200).json({
    status: "Success",
    message: "BusinessType Deleted!",
  });
});
exports.getBusinessTypes = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM BusinessTypes`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("No Business Types yet!", 404));
  }
  const businessTypes = sql.recordset;
  res.status(200).json({
    status: "Success",
    businessTypes,
  });
});
exports.getBusinessType = catchAsync(async (req, res, next) => {
  // console.log(req.body.BusinessTypeId);
  // const query = `SELECT * FROM BusinessTypes WHERE id=${req.params.id}`;
  const query = `SELECT * FROM BusinessTypes WHERE id=${req.params.id}`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(
      new AppError(
        "Business business Type Not found! Add BusinessType First!!",
        404
      )
    );
  }
  const businessType = sql.recordset;
  res.status(200).json({
    status: "Success",
    businessType,
  });
});
exports.getBusinessTypeByName = catchAsync(async (req, res, next) => {
  if (req.body.businessType) {
    const queryBusinessType = `SELECT id FROM BusinessTypes WHERE businessType='${req.body.businessType.toLowerCase()}' `;
    const sqlOper = await pool.request().query(queryBusinessType);
    if (sqlOper.recordset.length === 0) {
      return next(
        new AppError(
          `Business Type: '(${req.body.businessType.toLowerCase()})' doesn't exist!`,
          400
        )
      );
    }
    req.businessTypeId = sqlOper.recordset[0].id;
    return next();
  }
  return next(new AppError(`Provide a Business Type!`, 400));
});
