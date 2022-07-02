const { pool, mssql } = require("../db/mssql");
// const User = require('../models/user');
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.addInvoice = catchAsync(async (req, res, next) => {
  const { customerName, productName, productQuantity, totalAmount } = req.body;
  if (!customerName || !productName || !productQuantity || !totalAmount) {
    return next(new AppError(`Provide all required values!`, 400));
  }

  const query = `INSERT INTO Invoices 
  ( 
    customerName,
    productName,
    productQuantity,
    totalAmount,
    status,
    dateCreated,
    dateModified,
    createdBy,
    invoiceNumber
  ) 
  Output Inserted.id
  values (
  
    @customerName,
    @productName,
    @productQuantity,
    @totalAmount,
    @status,
    @dateCreated,
    @dateModified,
    @createdBy,
    @invoiceNumber
  ) `;

  sql = await pool
    .request()
    .input("customerName", mssql.VarChar, customerName)
    .input("productName", mssql.VarChar, productName)
    .input("productQuantity", mssql.Int, productQuantity)
    .input("totalAmount", mssql.Float, totalAmount)
    .input("status", mssql.Int, 1)
    .input("dateCreated", mssql.DateTimeOffset, new Date().toISOString())
    .input("dateModified", mssql.DateTimeOffset, new Date().toISOString())
    .input("createdBy", mssql.VarChar, req.user.userId)
    .input("invoiceNumber", mssql.VarChar, new Date().getTime())
    .query(query);

  // --------------------------

  res.status(201).json({
    success: true,
    message: "Invoice successfully created!",
  });
  next();
});
exports.updateInvoice = catchAsync(async (req, res, next) => {
  const queryInvoice = `SELECT * FROM Invoices WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryInvoice);
  if (sql.recordset.length === 0) {
    return next(new AppError("Invoice not found!", 404));
  }
  // console.log(req.body);
  const { customerName, productName, productQuantity, totalAmount, status } =
    req.body;
  if (
    !customerName ||
    !productName ||
    !productQuantity ||
    !totalAmount ||
    !status
  ) {
    return next(new AppError(`Provide all required values!`, 400));
  }

  const query = `UPDATE Invoices SET 
  customerName=@customerName,
  productName=@productName,
  productQuantity=@productQuantity,
  totalAmount=@totalAmount,
  status=@status,
  updatedBy=@updatedBy,
  dateModified=@dateModified
  WHERE  id=${req.params.id}`;

  await pool
    .request()
    .input("customerName", mssql.VarChar, customerName)
    .input("productName", mssql.VarChar, productName)
    .input("productQuantity", mssql.Int, productQuantity)
    .input("totalAmount", mssql.Float, totalAmount)
    .input("status", mssql.Int, status)
    .input("dateModified", mssql.DateTimeOffset, new Date().toISOString())
    .input("updatedBy", mssql.VarChar, req.user.userId)
    .query(query);

  res.status(200).json({
    status: "Success",
    message: "Invoice Updated!",
  });
});
exports.deleteInvoice = catchAsync(async (req, res, next) => {
  const queryInvoice = `SELECT * FROM Invoices WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryInvoice);
  if (sql.recordset.length === 0) {
    return next(new AppError("Invoice not found!", 404));
  }

  const query = `DELETE FROM Invoices WHERE  id=${req.params.id}`;

  await pool.request().query(query);

  res.status(200).json({
    status: "Success",
    message: "Invoice Deleted!",
  });
});
exports.getInvoices = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM Invoices`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("No Invoices yet!", 404));
  }
  const Invoices = sql.recordset;
  res.status(200).json({
    status: "Success",
    Invoices,
  });
});
exports.getInvoice = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM Invoices WHERE id=${req.params.id}`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return next(new AppError("Invoice Not found!!", 404));
  }
  const Invoice = sql.recordset[0];
  res.status(200).json({
    status: "Success",
    Invoice,
  });
});
