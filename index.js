const express = require("express");
const winston = require("winston");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();

app.use("/uploads/images", express.static(path.join("uploads", "images")));
app.use(
  "/uploads/documents",
  express.static(path.join("uploads", "documents"))
);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-auth-token"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, PUT"
  );
  next();
});

// require('./startup/logging')();
require("./startup/routes")(app);

require("./startup/config")();
require("./startup/db")();

app.use(bodyParser.json());

app.use((error, req, res, next) => {
 
  if(req.file) {
    fs.unlink(req.file.path, err => {
        console.log(err);
    });
  }


  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;

  console.log("from index", data);

  res.status(status).json({ message: message, data: data });
});

const port = process.env.PORT || 8001;
const server = app.listen(port, () =>
  winston.info(`Listening on port ${port}`)
);

module.exports = server;
