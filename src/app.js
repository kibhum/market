require("./db/mssql");
const path = require("path");
const express = require("express");
// swagger
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../swagger.json");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const createDbTablesRouter = require("./routers/createDbTablesRoutes");
const userRouter = require("./routers/userRoutes");
const profileRouter = require("./routers/profileRoutes");
const categoryRouter = require("./routers/categoryRoutes");
const attributeRouter = require("./routers/attributeRoutes");
const itemRouter = require("./routers/itemRoutes");
const invoiceRouter = require("./routers/invoiceRoutes");
const supplierRouter = require("./routers/supplierRoutes");
const customerRouter = require("./routers/customerRoutes");
const stockRouter = require("./routers/stockRoutes");
const batchRouter = require("./routers/batchRoutes");
const countryRouter = require("./routers/countryRoutes");
const warehouseRouter = require("./routers/warehouseRoutes");
const saleRouter = require("./routers/saleRoutes");
const operationRouter = require("./routers/operationRoutes");
const businessTypeRouter = require("./routers/businessTypeRoutes");
const returnedItemsRouter = require("./routers/returnedItemsRoutes");
const orderRouter = require("./routers/orderRoutes");
const printItemsRouter = require("./routers/printItemsRoutes");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
//paths
const publicDirectory = path.join(__dirname, "../public");
const viewsPath = path.join(__dirname, "../views");
const app = express();

//Define paths for express config
app.set("views", viewsPath);
//Global middlewares
app.use(cors());
app.options("*", cors());

//SET security HTTP headers
app.use(helmet());
//Development logging
if (process.env.NODE_ENV.trim() === "development") {
  app.use(morgan("dev"));
}
//Limit requests from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
// app.use('/', limiter);

//setup public directory to serve
//serving static files
app.use(express.static(publicDirectory));
//Body parser, reading data from the body into req.body
app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: "50mb" }));

//Parsing data from cookies
app.use(cookieParser());
//Data sanitization against NOSQL query injection

//Data sanitization against XSS
app.use(xss());

//Prevent parameter pollution
app.use(
  hpp({
    //To be excluded
    whitelist: ["duration"],
  })
);

app.use("/api/v1", createDbTablesRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/attribute", attributeRouter);
app.use("/api/v1/item", itemRouter);
app.use("/api/v1/returnedItem", returnedItemsRouter);
app.use("/api/v1/invoices", invoiceRouter);
app.use("/api/v1/suppliers", supplierRouter);
app.use("/api/v1/customer", customerRouter);
app.use("/api/v1/stock", stockRouter);
app.use("/api/v1/batch", batchRouter);
app.use("/api/v1/country", countryRouter);
app.use("/api/v1/warehouse", warehouseRouter);
app.use("/api/v1/sale", saleRouter);
app.use("/api/v1/operation", operationRouter);
app.use("/api/v1/businessType", businessTypeRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/print", printItemsRouter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`));
});

console.log(process.env.NODE_ENV);

app.use(globalErrorHandler);

module.exports = app;
