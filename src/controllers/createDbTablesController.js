const { pool, mssql } = require("../db/mssql");
// const User = require('../models/user');
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.createTables = catchAsync(async (req, res, next) => {
  const query = `CREATE TABLE dbo.Batches (
        id Int IDENTITY NOT NULL,
        batchName VarChar(100) NOT NULL,
        batchNumber VarChar(100) NOT NULL,
        createdBy VarChar(100) NOT NULL,
        dateModified DateTimeOffset NOT NULL,
        updatedBy VarChar(100),
        batchOrigin VarChar(100),
        warehouseId Int,
        supplierId Int,
        categoryId Int,
        unitBuyingPrice Float,
        dateCreated DateTimeOffset,
        stockNumber VarChar(100),
        batchQuantity Int,
        description VarChar(100), 
        CONSTRAINT PK_Batches PRIMARY KEY CLUSTERED (
          id
        )
    )
     
    CREATE TABLE dbo.BusinessTypes (
        id Int IDENTITY NOT NULL,
        businessType VarChar(100) NOT NULL,
        dateCreated DateTimeOffset NOT NULL,
        createdBy VarChar(100) NOT NULL,
        dateModified DateTimeOffset NOT NULL,
        updatedBy VarChar(100), 
        CONSTRAINT PK_BusinessType PRIMARY KEY CLUSTERED (
          id
        )
    )
    
    CREATE TABLE dbo.Categories (
        id Int IDENTITY NOT NULL,
        category VarChar(100) NOT NULL,
        createdBy VarChar(100) NOT NULL,
        updatedBy VarChar(100),
        dateCreated DateTimeOffset NOT NULL,
        dateModified DateTimeOffset NOT NULL
    )
    
    CREATE TABLE dbo.country (
        id Int IDENTITY NOT NULL,
        country VarChar(50) NOT NULL,
        currency VarChar(50) NOT NULL,
        createdBy VarChar(50) NOT NULL,
        dateCreated DateTimeOffset NOT NULL,
        updatedBy VarChar(50),
        dateModified DateTimeOffset NOT NULL, 
        CONSTRAINT PK_country PRIMARY KEY CLUSTERED (
          id
        )
    )
    
    CREATE TABLE dbo.Customers (
        id Int IDENTITY NOT NULL,
        customerName VarChar(100) NOT NULL,
        email VarChar(100) NOT NULL,
        phone VarChar(100) NOT NULL,
        createdBy VarChar(100) NOT NULL,
        updatedBy VarChar(100),
        dateCreated DateTimeOffset NOT NULL,
        dateModified DateTimeOffset NOT NULL,
        status Bit,
        customerDetails NVarChar(4000),
        country VarChar(100),
        businessTypeId Int, 
        CONSTRAINT PK_Customers PRIMARY KEY CLUSTERED (
          id
        )
    )
    
    CREATE TABLE dbo.Items (
        id Int IDENTITY NOT NULL,
        item VarChar(100) NOT NULL,
        createdBy VarChar(100) NOT NULL,
        updatedBy VarChar(100),
        dateModified DateTimeOffset NOT NULL,
        barcode VarChar(100) NOT NULL,
        sellingPrice Float,
        description VarChar(4000),
        itemImage VarChar(max),
        dateCreated DateTimeOffset NOT NULL,
        categoryId Int,
        supplierId Int NOT NULL,
        warehouseId Int,
        status Bit,
        brand VarChar(100),
        origin VarChar(100),
        sold Bit,
        dateSold DateTimeOffset,
        returned Bit,
        dateReturned DateTimeOffset,
        lastTimeScanned DateTimeOffset,
        operationSoldOn VarChar(100),
        batchNumber VarChar(100),
        batchName VarChar(100), 
        CONSTRAINT PK_Items PRIMARY KEY CLUSTERED (
          id
        )
    )
    
    CREATE TABLE dbo.newStock (
        id Int IDENTITY NOT NULL,
        stockName VarChar(100) NOT NULL,
        createdBy VarChar(100) NOT NULL,
        updatedBy VarChar(100),
        dateModified DateTimeOffset NOT NULL,
        warehouseId Int,
        categoryId Int,
        datecreated DateTimeOffset,
        purchaseOrderNumber VarChar(100),
        description VarChar(4000),
        origin VarChar(100),
        stockNumber VarChar(100),
        batches NVarChar(4000), 
        CONSTRAINT PK_newStock PRIMARY KEY CLUSTERED (
          id
        )
    )
    
    CREATE TABLE dbo.Profiles (
        id Int IDENTITY NOT NULL,
        userType VarChar(100) NOT NULL,
        accessLevel Int NOT NULL,
        createdBy VarChar(100) NOT NULL,
        updatedBy VarChar(100),
        dateModified DateTimeOffset NOT NULL, 
        CONSTRAINT PK_Profiles PRIMARY KEY CLUSTERED (
          id
        )
    )
    
    CREATE TABLE dbo.PurchaseOrders (
        id Int IDENTITY NOT NULL,
        supplierId Int NOT NULL,
        approvedBy VarChar(100),
        purchaseOrderNumber VarChar(100) NOT NULL,
        createdBy VarChar(100) NOT NULL,
        updatedBy VarChar(100),
        dateModified DateTimeOffset NOT NULL,
        status Int NOT NULL,
        items NVarChar(4000),
        dateApproved DateTimeOffset,
        dateCreated DateTimeOffset,
        totalPrice Float,
        transport VarChar(100),
        paymentMethod VarChar(100), 
        CONSTRAINT PK_PurchaseOrders PRIMARY KEY CLUSTERED (
          id
        )
    )
    
    CREATE TABLE dbo.ReturnedItems (
        id Int IDENTITY NOT NULL,
        reason VarChar(4000) NOT NULL,
        receivedBy VarChar(100) NOT NULL,
        updatedBy VarChar(100),
        warehouseId VarChar(100),
        dateModified DateTimeOffset,
        dateCreated DateTimeOffset,
        barcode VarChar(100),
        status Int, 
        CONSTRAINT PK_ReturnedItems PRIMARY KEY CLUSTERED (
          id
        )
    )
    
    CREATE TABLE dbo.saleOperations (
        id Int IDENTITY NOT NULL,
        operationType VarChar(100) NOT NULL,
        createdBy VarChar(100) NOT NULL,
        dateCreated DateTimeOffset NOT NULL,
        updatedBy VarChar(100),
        dateModified DateTimeOffset NOT NULL, 
        CONSTRAINT PK_saleOperations PRIMARY KEY CLUSTERED (
          id
        )
    )
    
    CREATE TABLE dbo.Sales (
        id Int IDENTITY NOT NULL,
        barcode VarChar(100) NOT NULL,
        itemName VarChar(100) NOT NULL,
        categoryId Int NOT NULL,
        customer VarChar(100) NOT NULL,
        dateCreated DateTimeOffset NOT NULL,
        dateModified DateTimeOffset NOT NULL,
        createdBy VarChar(100) NOT NULL,
        updatedBy VarChar(100),
        receivedBy VarChar(100),
        receiverPhone VarChar(100),
        operationType VarChar(100),
        warehouseId Int,
        customerType VarChar(100),
        price Float,
        supplierId Int,
        status Int,
        batchNumber VarChar(100), 
        CONSTRAINT PK_Purchases PRIMARY KEY CLUSTERED (
          id
        )
    )
    
    CREATE TABLE dbo.Suppliers (
        id Int IDENTITY NOT NULL,
        supplierName VarChar(100) NOT NULL,
        email VarChar(100) NOT NULL,
        phone VarChar(100) NOT NULL,
        createdBy VarChar(100) NOT NULL,
        updatedBy VarChar(100),
        dateCreated DateTimeOffset NOT NULL,
        dateModified DateTimeOffset NOT NULL,
        status Bit,
        supplierDetails NVarChar(4000),
        warehouseId Int,
        countryId Int,
        businessTypeId Int,
        country VarChar(100), 
        CONSTRAINT PK_Suppliers PRIMARY KEY CLUSTERED (
          id
        )
    )
    
    CREATE TABLE dbo.Transport (
        id Int IDENTITY NOT NULL,
        transportMode VarChar(100) NOT NULL,
        createdBy VarChar(100) NOT NULL,
        dateCreated DateTimeOffset NOT NULL,
        updatedBy VarChar(100),
        dateUpdated DateTimeOffset NOT NULL, 
        CONSTRAINT PK_Transport PRIMARY KEY CLUSTERED (
          id
        )
    )
    
    CREATE TABLE dbo.Users (
        id Int IDENTITY NOT NULL,
        userId VarChar(100) NOT NULL,
        firstName VarChar(100) NOT NULL,
        lastName VarChar(100) NOT NULL,
        phone VarChar(30) NOT NULL,
        email VarChar(100) NOT NULL,
        userPassword VarChar(300) NOT NULL,
        passwordModified DateTimeOffset NOT NULL,
        dateCreated DateTimeOffset NOT NULL,
        dateModified DateTimeOffset NOT NULL,
        active Bit,
        accessLevel Int,
        username VarChar(100),
        gender VarChar(100),
        userImage VarChar(max),
        origUserPassword VarChar(200), 
        CONSTRAINT PK_Users PRIMARY KEY CLUSTERED (
          id
        )
    )
    
    CREATE TABLE dbo.Warehouses (
        id Int IDENTITY NOT NULL,
        warehouseDetails NVarChar(4000) NOT NULL,
        dateCreated DateTimeOffset NOT NULL,
        createdBy VarChar(100) NOT NULL,
        dateModified DateTimeOffset NOT NULL,
        updatedBy VarChar(100),
        warehouseName VarChar(100), 
        CONSTRAINT PK_Warehouses PRIMARY KEY CLUSTERED (
          id
        )
    )
    `;
  await pool.request().query(query);

  res.status(201).json({
    success: true,
    message: "Tables successfully created!",
  });
});
