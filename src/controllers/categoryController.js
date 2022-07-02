const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const { pool, mssql } = require("../db/mssql");
// const User = require('../models/user');
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.addCategory = catchAsync(async (req, res, next) => {
  const { category } = req.body;

  if (!category) {
    return next(new AppError(`Provide a category!`, 400));
  }
  // check if accessLevel or type already exist

  const queryCategory = `SELECT * FROM Categories WHERE  category='${category.toLowerCase()}' `;
  const sqlCat = await pool.request().query(queryCategory);
  if (sqlCat.recordset.length > 0) {
    return next(new AppError(`Category: '(${category})' already exist!`, 400));
  }

  const query = `INSERT INTO Categories 
  ( 
    category,
    createdBy,
    dateCreated,
    dateModified
  ) 
  Output Inserted.id
  values (
  
    @category,
    @createdBy,
    @dateCreated,
    @dateModified
  ) `;

  sql = await pool
    .request()
    .input("category", mssql.VarChar, category.toLowerCase())
    .input("createdBy", mssql.VarChar, req.user.userId)
    .input("dateCreated", mssql.Date, new Date().toISOString())
    .input("dateModified", mssql.Date, new Date().toISOString())
    .query(query);

  // --------------------------

  res.status(201).json({
    success: true,
    message: "Category successfully created!",
  });
});
exports.updateCategory = catchAsync(async (req, res, next) => {
  const queryUser = `SELECT * FROM Categories WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryUser);
  if (sql.recordset.length === 0) {
    return next(new AppError("Category not found!", 404));
  }
  // console.log(req.body);
  const { category } = req.body;
  if (!category) {
    return next(new AppError(`Provide a category`, 400));
  }

  // check if what is updated is already there
  const queryCategory = `SELECT * FROM Categories WHERE category='${category}'`;
  const sqlCat = await pool.request().query(queryCategory);
  if (sqlCat.recordset.length > 0) {
    return next(new AppError(`Category:('${category}') already exist!`, 400));
  }

  const query = `UPDATE Categories SET 
  category=@category,
  updatedBy=@updatedBy,
  dateModified=@dateModified
  WHERE  id=${req.params.id}`;

  await pool
    .request()
    .input("category", mssql.VarChar, category)
    .input("updatedBy", mssql.VarChar, req.user.userId)
    .input("dateModified", mssql.VarChar, new Date().toISOString())
    .query(query);

  res.status(200).json({
    status: "Success",
    message: "Category Updated!",
  });
});
exports.deleteCategory = catchAsync(async (req, res, next) => {
  const queryCategory = `SELECT * FROM Categories WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryCategory);
  if (sql.recordset.length === 0) {
    return next(new AppError("Category not found!", 404));
  }

  const query = `DELETE FROM Categories WHERE  id=${req.params.id}`;

  await pool.request().query(query);

  res.status(200).json({
    status: "Success",
    message: "Category Deleted!",
  });
});
exports.getCategories = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM Categories`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("No Categories yet!", 404));
  }
  const categories = sql.recordset;
  res.status(200).json({
    status: "Success",
    categories,
  });
});
exports.getCategory = catchAsync(async (req, res, next) => {
  // console.log(req.body.categoryId);
  // const query = `SELECT * FROM Categories WHERE id=${req.params.id}`;
  const query = `SELECT * FROM Categories WHERE id=${req.body.categoryId}`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(
      new AppError("CategoryId Not found! Add Category First!!", 404)
    );
  }
  // const category = sql.recordset;
  // res.status(200).json({
  //   status: "Success",
  //   category,
  // });
  next();
});
exports.getCategoryByName = catchAsync(async (req, res, next) => {
  // console.log(req.params.category);
  // console.log(req.body.category);
  const category = req.params.category
    ? req.params.category
    : req.body.category;

  const queryCategory = `SELECT id FROM Categories WHERE  category='${category.toLowerCase()}' `;
  const sqlCat = await pool.request().query(queryCategory);
  if (sqlCat.recordset.length === 0) {
    return next(
      new AppError(
        `Category: '(${category.toLowerCase()})' doesn't exist!`,
        400
      )
    );
  }
  req.categoryId = sqlCat.recordset[0].id;
  next();
  // res.status(200).json({
  //   success: true,
  // });
});
