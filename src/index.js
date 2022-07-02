const fs = require("fs");
const path = require("path");
const https = require("https");
const dotenv = require("dotenv");
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION, Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: "./config.env" });

const app = require("./app");
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log("Server is up on port: " + port);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION, Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
