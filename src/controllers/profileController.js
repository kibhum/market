const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const { pool, mssql } = require("../db/mssql");
// const User = require('../models/user');
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.addProfile = catchAsync(async (req, res, next) => {
  const { accessLevel, userType: type } = req.body;

  if (!accessLevel || !type) {
    return next(new AppError("Provide all details!", 404));
  }
  // check if accessLevel or type already exist

  const queryProfile = `SELECT * FROM Profiles
  WHERE (accessLevel=${parseInt(accessLevel)} OR userType='${type}' )`;
  const sqlProf = await pool.request().query(queryProfile);
  if (sqlProf.recordset.length > 0) {
    return res.status(400).json({
      success: false,
      message: `accessLevel: '(${accessLevel})' or type:('${type}') already exist!`,
    });
  }

  const query = `INSERT INTO Profiles 
  ( 
    userType,
    accessLevel,
    createdBy,
    dateModified
  ) 
  Output Inserted.id
  values (
  
    @userType,
    @accessLevel,
    @createdBy,
    @dateModified
  ) `;

  sql = await pool
    .request()
    .input("userType", mssql.VarChar, type)
    .input("accessLevel", mssql.Int, accessLevel)
    .input("createdBy", mssql.VarChar, req.user.userId)
    .input("dateModified", mssql.Date, new Date().toISOString())
    .query(query);

  // --------------------------

  res.status(201).json({
    success: true,
    message: "Profile successfully created!",
  });
});
exports.updateProfile = catchAsync(async (req, res, next) => {
  const queryUser = `SELECT * FROM Profiles WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryUser);
  if (sql.recordset.length === 0) {
    return next(new AppError("Profile not found!", 404));
  }
  // console.log(req.body);
  const { accessLevel, userType: type } = req.body;
  // check if what is updated is already there
  const queryProfile = `SELECT * FROM Profiles
  WHERE (accessLevel=${parseInt(accessLevel)} AND id<>${
    req.params.id
  } OR userType='${type}' AND id<>${req.params.id} )`;
  //   const queryProfile = `SELECT * FROM Profiles
  // WHERE id<>${req.params.id}`;
  const sqlProf = await pool.request().query(queryProfile);
  console.log(sqlProf);
  if (sqlProf.recordset.length > 0) {
    return res.status(400).json({
      success: false,
      message: `accessLevel: '(${accessLevel})' or type:('${type}') already exist!`,
    });
  }

  const query = `UPDATE Profiles SET 
  userType=@userType,
  accessLevel=@accessLevel,
  updatedBy=@updatedBy,
  dateModified=@dateModified
  WHERE  id=${req.params.id}`;

  await pool
    .request()
    .input("userType", mssql.VarChar, type)
    .input("accessLevel", mssql.Int, accessLevel)
    .input("updatedBy", mssql.VarChar, req.user.userId)
    .input("dateModified", mssql.VarChar, new Date().toISOString())
    .query(query);

  res.status(200).json({
    status: "Success",
    message: "Profile Updated!",
  });
});
exports.deleteProfile = catchAsync(async (req, res, next) => {
  const queryUser = `SELECT * FROM Profiles WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryUser);
  if (sql.recordset.length === 0) {
    return next(new AppError("Profile not found!", 404));
  }

  const query = `DELETE FROM Profiles WHERE  id=${req.params.id}`;

  await pool.request().query(query);

  res.status(200).json({
    status: "Success",
    message: "Profile Deleted!",
  });
});
exports.getProfiles = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM Profiles`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("No profiles yet!", 404));
  }
  const profiles = sql.recordset;
  res.status(200).json({
    status: "Success",
    profiles,
  });
});
exports.getProfile = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM Profiles WHERE id=${req.params.id}`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("Profile Not found!", 404));
  }
  const profiles = sql.recordset;
  res.status(200).json({
    status: "Success",
    profiles,
  });
});
exports.getProfileByName = catchAsync(async (req, res, next) => {
  if (!req.body.profile) {
    req.body.profile = "user";
  }
  const queryProfile = `SELECT accessLevel FROM Profiles WHERE userType='${req.body.profile}' `;
  const sqlCat = await pool.request().query(queryProfile);
  console.log(sqlCat);
  if (sqlCat.recordset.length === 0) {
    return next(
      new AppError(`Profile: ('${req.body.profile}') doesn't exist!`, 400)
    );
  }
  req.accessLevel = sqlCat.recordset[0].accessLevel;
  next();
});
