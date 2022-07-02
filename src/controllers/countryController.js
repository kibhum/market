const { pool, mssql } = require("../db/mssql");
// const User = require('../models/user');
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.addCountry = catchAsync(async (req, res, next) => {
  const { country, currency } = req.body;

  if (!country || !currency) {
    return res.status(404).json({
      success: false,
      message: `Provide Country and Currency!!`,
    });
    // return next(new AppError(`Provide Country and Currency!`, 400));
  }

  const query = `INSERT INTO country 
  ( 
    country,
    currency,
    createdBy,
    dateCreated,
    dateModified
  ) 
  values (
  
    @country,
    @currency,
    @createdBy,
    @dateCreated,
    @dateModified
  ) `;

  sql = await pool
    .request()
    .input("country", mssql.VarChar, country)
    .input("currency", mssql.VarChar, currency)
    .input("createdBy", mssql.VarChar, req.user.userId)
    .input("dateCreated", mssql.Date, new Date().toISOString())
    .input("dateModified", mssql.Date, new Date().toISOString())
    .query(query);

  // --------------------------

  res.status(201).json({
    success: true,
    message: "Country successfully Added!",
  });
});
exports.updateCountry = catchAsync(async (req, res, next) => {
  const queryCountry = `SELECT * FROM country WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryCountry);
  if (sql.recordset.length === 0) {
    return res.status(404).json({
      success: false,
      message: `Country not found!!`,
    });
    // return next(new AppError("Country not found!", 404));
  }
  // console.log(req.body);
  const { country, currency } = req.body;

  if (!country || !currency) {
    return res.status(400).json({
      success: false,
      message: `Provide Country and Currency!`,
    });
    // return next(new AppError(`Provide Country and Currency!`, 400));
  }

  const query = `UPDATE country SET 
  country=@country,
  currency=@currency,
  updatedBy=@updatedBy,
  dateModified=@dateModified
  WHERE  id=${req.params.id}`;

  await pool
    .request()
    .input("country", mssql.VarChar, country)
    .input("currency", mssql.VarChar, currency)
    .input("updatedBy", mssql.VarChar, req.user.userId)
    .input("dateModified", mssql.Date, new Date().toISOString())
    .query(query);

  res.status(200).json({
    status: "Success",
    message: "Country Updated!",
  });
});
exports.deleteCountry = catchAsync(async (req, res, next) => {
  const queryCategory = `SELECT * FROM country WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryCategory);
  if (sql.recordset.length === 0) {
    return res.status(404).json({
      success: false,
      message: `Country not found!!`,
    });
    // return next(new AppError("Country not found!", 404));
  }

  const query = `DELETE FROM country WHERE  id=${req.params.id}`;

  await pool.request().query(query);

  res.status(200).json({
    status: "Success",
    message: "Country Deleted!",
  });
});
exports.getCountries = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM country`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return res.status(404).json({
      success: false,
      message: `No Countries yet!!`,
    });
    // return next(new AppError("No Countries yet!", 404));
  }
  const countries = sql.recordset;
  res.status(200).json({
    status: "Success",
    countries,
  });
});
exports.getCountry = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM country WHERE id=${req.params.id}`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return res.status(404).json({
      success: false,
      message: `Country Not found!`,
    });
    // return next(new AppError("Country Not found!", 404));
  }
  const country = sql.recordset;
  res.status(200).json({
    status: "Success",
    country,
  });
});
exports.getCountryByName = catchAsync(async (req, res, next) => {
  // console.log(req.params.category);
  // console.log(req.body.category);
  const country = req.params.country ? req.params.country : req.body.country;

  const queryCountry = `SELECT id FROM country WHERE  country='${country.toLowerCase()}' `;
  const sqlCat = await pool.request().query(queryCountry);
  if (sqlCat.recordset.length === 0) {
    return res.status(400).json({
      success: false,
      message: `Country '(${country.toLowerCase()})' doesn't exist!`,
    });
    // return next(
    //   new AppError(`Country '(${country.toLowerCase()})' doesn't exist!`, 400)
    // );
  }
  req.countryId = sqlCat.recordset[0].id;
  next();
  // res.status(200).json({
  //   success: true,
  //   id: sqlCat.recordset[0],
  // });
});
