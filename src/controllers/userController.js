const multer = require("multer");
const sharp = require("sharp");
// const User = require('../models/user');
const { pool, mssql } = require("../db/mssql");

const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// works
exports.allUsers = catchAsync(async (req, res, next) => {
  const query = ` SELECT id,userId,firstName,lastName,phone,email,username,accessLevel,gender,userImage FROM Users WHERE active=1`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("Users not found!", 404));
  }
  console.log(sql.recordset);
  const users = sql.recordset;
  res.status(200).json({
    status: "Success",
    data: {
      users,
    },
  });
});
// works
exports.singleUser = catchAsync(async (req, res, next) => {
  const query = `SELECT id,userId,firstName,lastName,phone,email,username,accessLevel,gender,userImage FROM Users WHERE (active=1 AND id=${req.params.id}) `;

  const sql = await pool.request().query(query);

  if (sql.recordset.length === 0) {
    return next(new AppError("User not found!", 404));
  }
  const user = sql.recordset;

  res.status(200).json({
    status: "Success",
    data: {
      user,
    },
  });
});
//works
exports.updateUser = catchAsync(async (req, res, next) => {
  // console.log(req.body);
  const queryUser = `SELECT * FROM Users WHERE (active=1 AND id=${req.params.id}) `;
  const sql = await pool.request().query(queryUser);
  if (sql.recordset.length === 0) {
    return next(new AppError("User not found!", 404));
  }
  // console.log(req.body);
  const {
    firstName,
    lastName,
    username,
    phone,
    email,
    gender,
    userImage = null,
  } = req.body;

  // Unique email
  const queryEmail = `SELECT * FROM Users WHERE (email='${email}' AND id<>${req.params.id})`;
  const sqlEmail = await pool.request().query(queryEmail);
  // Checking if email already exist
  if (sqlEmail.recordset.length > 0) {
    return next(new AppError("Email already exist!!", 400));
  }
  // Unique Username
  const queryUsername = `SELECT * FROM Users WHERE (username='${username}' AND id<>${req.params.id})`;
  const sqlUsername = await pool.request().query(queryUsername);
  // Checking if username already exist
  if (sqlUsername.recordset.length > 0) {
    return next(new AppError("Username already exist!!", 400));
  }
  const query = `UPDATE Users SET 
  firstName=@firstName,
  lastName=@lastName,
  username=@username,
  phone=@phone,
  email=@email,
  dateModified=@dateModified,
  accessLevel=@accessLevel,
  gender=@gender,
  userImage=@userImage
  WHERE  id=${req.params.id}`;

  await pool
    .request()
    .input("firstName", mssql.VarChar, firstName)
    .input("lastName", mssql.VarChar, lastName)
    .input("username", mssql.VarChar, username)
    .input("phone", mssql.VarChar, phone)
    .input("email", mssql.VarChar, email)
    .input("userImage", mssql.VarChar, userImage)
    .input("gender", mssql.VarChar, gender)
    .input("dateModified", mssql.VarChar, new Date().toISOString())
    .input("accessLevel", mssql.Int, req.accessLevel)
    .query(query);

  res.status(200).json({
    status: "Success",
    message: "User Updated!",
  });
});
// works
exports.deleteUser = catchAsync(async (req, res, next) => {
  const queryUser = `SELECT * FROM Users WHERE (active=1 AND id=${req.params.id}) `;
  const sql = await pool.request().query(queryUser);
  console.log(sql.recordset.length);
  if (sql.recordset.length === 0) {
    return next(new AppError("User not found!", 404));
  }
  const query = `UPDATE Users SET active=0 WHERE  id=${req.params.id}`;
  await pool.request().query(query);
  res.status(200).json({
    status: "Success",
    message: "User deleted!",
  });
});
