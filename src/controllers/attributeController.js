const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const { pool, mssql } = require("../db/mssql");
// const User = require('../models/user');
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.addAttribute = catchAsync(async (req, res, next) => {
  const { productSize, color, weight, quantity } = req.body;

  if (!productSize || !color || !weight || !quantity) {
    return next(new AppError(`Provide all Attributes!`, 400));
  }

  const query = `INSERT INTO ProductAttributes 
  ( 
    productId,
    productSize,
    color,
    weight,
    quantity,
    createdBy,
    dateCreated,
    dateModified
  ) 
  values (
  
    @productId,
    @productSize,
    @color,
    @weight,
    @quantity,
    @createdBy,
    @dateCreated,
    @dateModified
  ) `;

  sql = await pool
    .request()
    .input("productId", mssql.VarChar, new Date().getTime())
    .input("productSize", mssql.VarChar, productSize)
    .input("color", mssql.VarChar, color)
    .input("weight", mssql.VarChar, weight)
    .input("quantity", mssql.VarChar, quantity)
    .input("createdBy", mssql.VarChar, req.user.userId)
    .input("dateCreated", mssql.Date, new Date().toISOString())
    .input("dateModified", mssql.Date, new Date().toISOString())
    .query(query);

  // --------------------------

  res.status(201).json({
    success: true,
    message: "Attribute successfully created!",
  });
});
exports.updateAttribute = catchAsync(async (req, res, next) => {
  const queryUser = `SELECT * FROM ProductAttributes WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryUser);
  if (sql.recordset.length === 0) {
    return next(new AppError("Attribute not found!", 404));
  }
  // console.log(req.body);
  const { productSize, color, weight, quantity } = req.body;

  if (!productSize || !color || !weight || !quantity) {
    return next(new AppError(`Provide all Attributes!`, 400));
  }

  const query = `UPDATE ProductAttributes SET 
  productSize=@productSize,
  color=@color,
  weight=@weight,
  quantity=@quantity,
  updatedBy=@updatedBy,
  dateModified=@dateModified
  WHERE  id=${req.params.id}`;

  await pool
    .request()
    .input("productSize", mssql.VarChar, productSize)
    .input("color", mssql.VarChar, color)
    .input("weight", mssql.VarChar, weight)
    .input("quantity", mssql.VarChar, quantity)
    .input("updatedBy", mssql.VarChar, req.user.userId)
    .input("dateModified", mssql.Date, new Date().toISOString())
    .query(query);

  res.status(200).json({
    status: "Success",
    message: "Product Attributes Updated!",
  });
});
exports.deleteAttribute = catchAsync(async (req, res, next) => {
  const queryCategory = `SELECT * FROM ProductAttributes WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryCategory);
  if (sql.recordset.length === 0) {
    return next(new AppError("Attribute not found!", 404));
  }

  const query = `DELETE FROM ProductAttributes WHERE  id=${req.params.id}`;

  await pool.request().query(query);

  res.status(200).json({
    status: "Success",
    message: "Attribute Deleted!",
  });
});
exports.getAttributes = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM ProductAttributes`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("No Products Attributes yet!", 404));
  }
  const attributes = sql.recordset;
  res.status(200).json({
    status: "Success",
    attributes,
  });
});
exports.getAttribute = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM ProductAttributes WHERE id=${req.params.id}`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("Attribute Not found!", 404));
  }
  const attribute = sql.recordset;
  res.status(200).json({
    status: "Success",
    attribute,
  });
});
