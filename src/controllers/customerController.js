const validator = require("validator");
const { pool, mssql } = require("../db/mssql");
// const User = require('../models/user');
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.addCustomer = catchAsync(async (req, res, next) => {
  const { customerName, email, phone, country, customerDetails, businessType } =
    req.body;
  const querycustomerName = `SELECT * FROM Customers WHERE customerName='${customerName.toLowerCase()}' `;
  const sqlCat = await pool.request().query(querycustomerName);
  if (sqlCat.recordset.length > 0) {
    return res.status(400).json({
      success: false,
      message: `customer Name: '(${customerName})' already exist!Choose a different name!`,
    });
  }

  // email validation
  if (!validator.isEmail(email)) {
    return next(new AppError("Write a valid email!!", 400));
  }
  if (
    !customerName ||
    !email ||
    !phone ||
    !country ||
    !customerDetails ||
    !businessType
  ) {
    // return next(new AppError(`Provide all required values!`, 400));
    return res.status(400).json({
      success: false,
      message: `Provide all required values!`,
    });
  }

  const query = `INSERT INTO Customers 
  ( 
    customerName,
    email,
    phone,
    country,
    customerDetails,
    status,
    dateCreated,
    dateModified,
    createdBy,
    businessTypeId
  ) 
  Output Inserted.id
  values (
  
    @customerName,
    @email,
    @phone,
    @country,
    @customerDetails,
    @status,
    @dateCreated,
    @dateModified,
    @createdBy,
    @businessTypeId
  ) `;

  sql = await pool
    .request()
    .input("customerName", mssql.VarChar, customerName.toLowerCase())
    .input("email", mssql.VarChar, email)
    .input("phone", mssql.VarChar, phone)
    .input("country", mssql.VarChar, country)
    .input("customerDetails", mssql.NVarChar, JSON.stringify(customerDetails))
    .input("status", mssql.Bit, 1)
    .input("dateCreated", mssql.DateTimeOffset, new Date().toISOString())
    .input("dateModified", mssql.DateTimeOffset, new Date().toISOString())
    .input("createdBy", mssql.VarChar, req.user.userId)
    .input("businessTypeId", mssql.Int, req.businessTypeId)
    .query(query);

  // --------------------------

  res.status(201).json({
    success: true,
    message: "customer successfully created!",
  });
});
exports.updateCustomer = catchAsync(async (req, res, next) => {
  const queryInvoice = `SELECT * FROM Customers WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryInvoice);
  if (sql.recordset.length === 0) {
    // return next(new AppError("customer not found!", 404));
    return res.status(404).json({
      success: false,
      message: `customer not found!!`,
    });
  }

  const { customerName, email, phone, country, customerDetails, businessType } =
    req.body;
  // email validation
  if (!validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      message: `Write a valid email!!`,
    });
    // return next(new AppError("Write a valid email!!", 400));
  }
  if (
    !customerName ||
    !email ||
    !phone ||
    !country ||
    !customerDetails ||
    !businessType
  ) {
    // return next(new AppError(`Provide all required values!`, 400));
    return res.status(400).json({
      success: false,
      message: `Provide all required values!!`,
    });
  }

  const query = `UPDATE Customers SET 
  customerName=@customerName,
  email=@email,
  phone=@phone,
  country=@country,
  customerDetails=@customerDetails,
  updatedBy=@updatedBy,
  dateModified=@dateModified,
  businessTypeId=@businessTypeId
  WHERE  id=${req.params.id}`;

  await pool
    .request()
    .input("customerName", mssql.VarChar, customerName)
    .input("email", mssql.VarChar, email)
    .input("phone", mssql.VarChar, phone)
    .input("country", mssql.VarChar, country)
    .input("businessTypeId", mssql.Int, req.businessTypeId)
    .input("customerDetails", mssql.NVarChar, JSON.stringify(customerDetails))
    .input("dateModified", mssql.DateTimeOffset, new Date().toISOString())
    .input("updatedBy", mssql.VarChar, req.user.userId)
    .query(query);

  res.status(200).json({
    status: "Success",
    message: "customer Updated!",
  });
});
exports.deleteCustomer = catchAsync(async (req, res, next) => {
  const querycustomer = `SELECT * FROM Customers WHERE id=${req.params.id} `;
  const sql = await pool.request().query(querycustomer);
  if (sql.recordset.length === 0) {
    // return next(new AppError("customer not found!", 404));
    return res.status(404).json({
      success: false,
      message: `customer not found!`,
    });
  }

  const query = `UPDATE  Customers SET status=0 WHERE  id=${req.params.id}`;

  await pool.request().query(query);

  res.status(200).json({
    status: "Success",
    message: "customer Deleted!",
  });
});
exports.getCustomers = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM Customers`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    // return next(new AppError("No Customers yet!", 404));
    return res.status(404).json({
      success: false,
      message: `No Customers yet!`,
    });
  }

  //   const products = sql.recordset;
  sql.recordset.forEach((item) => {
    item.customerDetails = JSON.parse(item.customerDetails);
  });
  res.status(200).json(sql.recordset);
});
exports.getCustomer = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM Customers WHERE id=${req.params.id}`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return res.status(404).json({
      success: false,
      message: `customer Not found!!`,
    });
    // return next(new AppError("customer Not found!!", 404));
  }
  const customer = sql.recordset[0];
  customer.customerDetails = JSON.parse(customer.customerDetails);
  res.status(200).json({
    status: "Success",
    customer,
  });
});
exports.getCustomerByName = catchAsync(async (req, res, next) => {
  if (req.body.customer) {
    const querycustomer = `SELECT id FROM Customers WHERE  customerName='${req.body.customer.toLowerCase()}' `;
    const sqlCat = await pool.request().query(querycustomer);
    if (sqlCat.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `customer: '(${req.body.customer.toLowerCase()})' doesn't exist!`,
      });
      // return next(
      //   new AppError(
      //     `customer: '(${req.body.customer.toLowerCase()})' doesn't exist!`,
      //     400
      //   )
      // );
    }
    req.customerId = sqlCat.recordset[0].id;
    return next();
  }
  return res.status(400).json({
    success: false,
    message: `Provide a customer!`,
  });
  // return next(new AppError(`Provide a customer!`, 400));
});
