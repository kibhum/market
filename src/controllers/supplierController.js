const validator = require("validator");
const { pool, mssql } = require("../db/mssql");
// const User = require('../models/user');
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.addSupplier = catchAsync(async (req, res, next) => {
  const { supplierName, email, phone, country, supplierDetails } = req.body;
  const querySupplierName = `SELECT * FROM Suppliers WHERE  supplierName='${supplierName.toLowerCase()}' `;
  const sqlCat = await pool.request().query(querySupplierName);
  if (sqlCat.recordset.length > 0) {
    // return next(
    //   new AppError(
    //     `Supplier Name: '(${supplierName})' already exist!Choose a different name!`,
    //     400
    //   )
    // );
    return res.status(400).json({
      success: false,
      message: `Supplier Name: '(${supplierName})' already exist!Choose a different name!`,
    });
  }

  // email validation
  if (!validator.isEmail(email)) {
    return next(new AppError("Write a valid email!!", 400));
  }
  if (!supplierName || !email || !phone || !country || !supplierDetails) {
    // return next(new AppError(`Provide all required values!`, 400));
    return res.status(400).json({
      success: false,
      message: `Provide all required values!`,
    });
  }

  const query = `INSERT INTO Suppliers 
  ( 
    supplierName,
    email,
    phone,
    country,
    supplierDetails,
    status,
    dateCreated,
    dateModified,
    createdBy,
    businessTypeId
  ) 
  Output Inserted.id
  values (
  
    @supplierName,
    @email,
    @phone,
    @country,
    @supplierDetails,
    @status,
    @dateCreated,
    @dateModified,
    @createdBy,
    @businessTypeId
  ) `;

  sql = await pool
    .request()
    .input("supplierName", mssql.VarChar, supplierName.toLowerCase())
    .input("email", mssql.VarChar, email)
    .input("phone", mssql.VarChar, phone)
    .input("country", mssql.VarChar, country)
    .input("supplierDetails", mssql.NVarChar, JSON.stringify(supplierDetails))
    .input("status", mssql.Bit, 1)
    .input("dateCreated", mssql.DateTimeOffset, new Date().toISOString())
    .input("dateModified", mssql.DateTimeOffset, new Date().toISOString())
    .input("createdBy", mssql.VarChar, req.user.userId)
    .input("businessTypeId", mssql.Int, req.businessTypeId)
    .query(query);

  // --------------------------

  res.status(201).json({
    success: true,
    message: "Supplier successfully created!",
  });
});
exports.updateSupplier = catchAsync(async (req, res, next) => {
  const queryInvoice = `SELECT * FROM Suppliers WHERE id=${req.params.id} `;
  const sql = await pool.request().query(queryInvoice);
  if (sql.recordset.length === 0) {
    // return next(new AppError("Supplier not found!", 404));
    return res.status(404).json({
      success: false,
      message: `Supplier not found!!`,
    });
  }

  const { supplierName, email, phone, country, supplierDetails } = req.body;
  // email validation
  if (!validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      message: `Write a valid email!!`,
    });
    // return next(new AppError("Write a valid email!!", 400));
  }
  if (!supplierName || !email || !phone || !country || !supplierDetails) {
    // return next(new AppError(`Provide all required values!`, 400));
    return res.status(400).json({
      success: false,
      message: `Provide all required values!!`,
    });
  }

  const query = `UPDATE Suppliers SET 
  supplierName=@supplierName,
  email=@email,
  phone=@phone,
  country=@country,
  supplierDetails=@supplierDetails,
  updatedBy=@updatedBy,
  dateModified=@dateModified
  WHERE  id=${req.params.id}`;

  await pool
    .request()
    .input("supplierName", mssql.VarChar, supplierName)
    .input("email", mssql.VarChar, email)
    .input("phone", mssql.VarChar, phone)
    .input("country", mssql.VarChar, country)
    .input("supplierDetails", mssql.NVarChar, JSON.stringify(supplierDetails))
    .input("dateModified", mssql.DateTimeOffset, new Date().toISOString())
    .input("updatedBy", mssql.VarChar, req.user.userId)
    .query(query);

  res.status(200).json({
    status: "Success",
    message: "Supplier Updated!",
  });
});
exports.deleteSupplier = catchAsync(async (req, res, next) => {
  const querySupplier = `SELECT * FROM Suppliers WHERE id=${req.params.id} `;
  const sql = await pool.request().query(querySupplier);
  if (sql.recordset.length === 0) {
    // return next(new AppError("Supplier not found!", 404));
    return res.status(404).json({
      success: false,
      message: `Supplier not found!`,
    });
  }

  const query = `UPDATE  Suppliers SET status=0 WHERE  id=${req.params.id}`;

  await pool.request().query(query);

  res.status(200).json({
    status: "Success",
    message: "Supplier Deleted!",
  });
});
exports.getSuppliers = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM Suppliers`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    // return next(new AppError("No Suppliers yet!", 404));
    return res.status(404).json({
      success: false,
      message: `No Suppliers yet!`,
    });
  }

  //   const products = sql.recordset;
  sql.recordset.forEach((item) => {
    item.supplierDetails = JSON.parse(item.supplierDetails);
  });
  res.status(200).json(sql.recordset);
});
exports.getSupplier = catchAsync(async (req, res, next) => {
  const query = `SELECT * FROM Suppliers WHERE id=${req.params.id}`;
  const sql = await pool.request().query(query);
  if (sql.recordset.length === 0) {
    return res.status(404).json({
      success: false,
      message: `Supplier Not found!!`,
    });
    // return next(new AppError("Supplier Not found!!", 404));
  }
  const Supplier = sql.recordset[0];
  Supplier.supplierDetails = JSON.parse(Supplier.supplierDetails);
  res.status(200).json({
    status: "Success",
    Supplier,
  });
});
exports.getSupplierByName = catchAsync(async (req, res, next) => {
  if (req.body.supplier) {
    const querySupplier = `SELECT id FROM Suppliers WHERE  supplierName='${req.body.supplier.toLowerCase()}' `;
    const sqlCat = await pool.request().query(querySupplier);
    if (sqlCat.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Supplier: '(${req.body.supplier.toLowerCase()})' doesn't exist!`,
      });
      // return next(
      //   new AppError(
      //     `Supplier: '(${req.body.supplier.toLowerCase()})' doesn't exist!`,
      //     400
      //   )
      // );
    }
    req.supplierId = sqlCat.recordset[0].id;
    return next();
  }
  return res.status(400).json({
    success: false,
    message: `Provide a Supplier!`,
  });
  // return next(new AppError(`Provide a Supplier!`, 400));
});
