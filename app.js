var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var session = require("express-session");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var testRouter = require("./routes/test");

var app = express();

app.set("trust proxy", 1); // trust first proxy
// Use the session middleware
app.use(session({ secret: "keyboard cat", cookie: { maxAge: 60000 } }));

app.use(express.static(__dirname + "/public"));
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

//app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/test", testRouter);
app.get("/testSession", function (req, res) {
  // set
  req.session.email = "test@domain.com";

  // get
  var temp = req.session.email;

  res.send("hello" + temp);
});

app.get("/driver", function (req, res) {
  // put the data in the database
  // pulling in mysql
  var mysql = require("mysql");
  // set up a connection
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "test",
    password: "",
  });

  // hold the data that we going to send back.
  var output = "";

  console.log(req.params.id);

  con.connect(function (err) {
    if (err) throw err;
    con.query(
      "SELECT * FROM customerorders WHERE `orderstatus`='PENDING' OR `orderstatus`='GETTING READY'",
      function (err, result, fields) {
        if (err) throw err;
        console.log(result);

        // looping over the records
        // for (var i = 0; i < result.length; i++) {
        //   output =
        //     output +
        //     "<tr><th>ID</th><th>ITEMS-QTY</th><th>ADDRESS</th><th>STATUS</th></tr><tr><td>" +
        //     result[i].id +
        //     "</td><td>" +
        //     result[i].items +
        //     "</td><td>" +
        //     result[i].address +
        //     "</td><td>" +
        //     "<button id='ordercomplete' onclick=location.href='order/" +
        //     result[i].id +
        //     "'>Complete Order</button>" +
        //     "</td><tr></tr></tr>";
        // }

        // return the output variable
        res.render("driver", { result: result });
      }
    );
  });
});

app.post("/updateStatus", function (req, res) {
  // put the data in the database
  // pulling in mysql
  var mysql = require("mysql");

  // set up a connection
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "test",
    password: "",
  });

  con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
    var sql =
      "UPDATE `test`.`customerorders` SET `orderstatus`='GETTING READY' WHERE orderstatus='PENDING'";
    console.log(sql);
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("1 record inserted");
    });
  });
  res.send("Table Updated");
});

app.get("/", function (req, res) {
  var mysql = require("mysql");
  var username = req.body.orderby;
  // set up a connection
  var con = mysql.createConnection({
    multipleStatements: true,
    host: "localhost",
    user: "root",
    database: "test",
    password: "",
  });

  console.log(username);

  // hold the data that we going to send back.
  var outputMenu = "";

  con.connect(function (err) {
    if (err) throw err;
    con.query("SELECT * FROM products", function (err, outputMenu, fields) {
      if (err) throw err;
      console.log(outputMenu);

      // looping over the records
      // for (var i = 0; i < result.length; i++) {
      //   output = output + result[i].name + "---" + result[i].price + "<br>";
      // }

      // return the output variable
      res.render("index", {
        outputMenu: outputMenu,
      });
    });
  });
});

app.get("/order/:id", function (req, res) {
  const id = req.params.id;
  console.log(id);

  var mysql = require("mysql");
  // set up a connection
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "test",
    password: "",
  });

  con.connect(function (err) {
    if (err) throw err;
    var sql =
      "UPDATE `test`.`customerorders` SET `orderstatus`='Complete' WHERE `id`='" +
      id +
      "' AND orderstatus='GETTING READY';";
    console.log(sql);
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("1 record inserted");
    });
  });
  res.redirect("back");
});

app.get("/getRecents", function (req, res) {
  var un = req.query.un;
  var id = req.query.id;

  var mysql = require("mysql");
  // set up a connection
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "test",
    password: "",
  });

  con.connect(function (err) {
    if (err) throw err;
    con.query(
      "SELECT * FROM customerorders WHERE orderby='" + un + "'",
      function (err, recents, fields) {
        if (err) throw err;
        //   console.log(recents);

        var output = "";

        // looping over the records
        for (var i = 0; i < recents.length; i++) {
          output =
            output +
            "<tr><th>ITEMS-QTY</th><th>TOTAL</th><th>STATUS</th></tr><tr><td>" +
            recents[i].items +
            "</td><td>" +
            recents[i].total +
            "€" +
            "</td><td>" +
            recents[i].orderstatus +
            "</td><tr></tr></tr>";
        }

        // return the output variable
        res.send(output);
      }
    );
  });
});

app.get("/manager", function (req, res) {
  req.session.manager = 1;

  req.session.email = "";

  // put the data in the database
  // pulling in mysql
  var mysql = require("mysql");
  // set up a connection
  var con = mysql.createConnection({
    multipleStatements: true,
    host: "localhost",
    user: "root",
    database: "test",
    password: "",
  });

  // hold the data that we going to send back.
  var output = "";

  var queries = [
    "SELECT * FROM customerorders where time BETWEEN CURDATE()-7 AND CURDATE()",
    "SELECT * FROM customerorders where time BETWEEN CURDATE()-30 AND CURDATE()",
    "SELECT * FROM customerorders where time BETWEEN CURDATE()-1 AND CURDATE()",
  ];

  con.connect(function (err) {
    if (err) throw err;
    con.query(queries.join(";"), function (err, result, fields) {
      if (err) throw err;
      console.log(result);

      var total = 0;

      // looping over the records
      // for (var i = 0; i < result.length; i++) {
      //   output =
      //     output +
      //     "<tr><th>ORDER NUMBER</th><th>CANCEL ORDER</th></tr><tr><td>" +
      //     result[i].id +
      //     "</td><td><button onclick=location.href='cancel/" +
      //     result[i].id +
      //     "'>CANCEL</button></td></tr><tr></tr></tr>";
      // }

      // return the output variable

      res.render("manager", {
        result: result[0],
        month: result[1],
        day: result[2],
      });
    });
  });
});
/* *************** RETRIEVING IMAGES FROM DB ************************** */
app.get("/getname", function (req, res) {
  var path = require("path");
  var fileName = "C:\\image\\test.png";
  var extension = path.extname(fileName);
  var file = path.basename(fileName, extension);

  res.send("images/" + file + extension);
});

app.get("/getImage", function (req, res) {
  // put the data in the database
  // pulling in mysql
  var mysql = require("mysql");
  // set up a connection
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "test",
    password: "",
  });

  con.connect(function (err) {
    if (err) throw err;
    con.query(
      "SELECT picture FROM products WHERE id = 1",
      function (err, result, fields) {
        if (err) throw err;

        res.send(result[0].picture);
      }
    );
  });
});

app.get("/getImageFromFile", function (req, res) {
  // put the data in the database
  // pulling in mysql
  var mysql = require("mysql");
  // set up a connection
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "test",
    password: "",
  });

  con.connect(function (err) {
    if (err) throw err;
    con.query(
      "SELECT picturepath FROM products WHERE id = 1",
      function (err, result, fields) {
        if (err) throw err;

        res.send(result[0].picturepath);
      }
    );
  });
});

/******************************************************************/

app.get("/getRevenueManager", function (req, res) {
  // put the data in the database
  // pulling in mysql
  var mysql = require("mysql");
  // set up a connection
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "test",
    password: "",
  });

  // hold the data that we going to send back.
  var total = 0;

  con.connect(function (err) {
    if (err) throw err;
    con.query(
      "SELECT total FROM customerorders;",
      function (err, result, fields) {
        if (err) throw err;
        console.log(result);

        // looping over the records
        for (var i = 0; i < result.length; i++) {
          total = total + result[i].total;
        }

        // return the output variable
        res.send("Total Revenue: " + total + "€");
      }
    );
  });
});

app.get("/cancel/:id", function (req, res) {
  const id = req.params.id;
  console.log(id);

  var mysql = require("mysql");
  // set up a connection
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "test",
    password: "",
  });

  con.connect(function (err) {
    if (err) throw err;
    var sql = "DELETE FROM `test`.`customerorders` WHERE `id`='" + id + "';";
    console.log(sql);
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("1 record deleted");
    });
  });
  res.redirect("back");
});

app.post("/checkTheLogin", function (req, res) {
  // catching the variables
  var username = req.body.username;
  var pass = req.body.password;
  var myVar = 1;

  // setting the username into the session
  req.session.username = username;
  req.session.validSession = true;

  var timeLeft = req.session.cookie.maxAge / 1000;
  console.log("Time left " + timeLeft);

  // put the data in the database
  // pulling in mysql
  var mysql = require("mysql");
  // set up a connection
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "test",
    password: "",
  });

  con.connect(function (err) {
    if (err) throw err;
    con.query(
      "SELECT * FROM users WHERE username = '" +
        username +
        "' AND PASSWORD = '" +
        pass +
        "' LIMIT 1;",
      function (err, result, fields) {
        if (err) throw err;
        console.log(result);
        // return the account type back
        res.send(result[0].acctype);
      }
    );
  });
});

app.post("/putInAddress", function (req, res) {
  // catching the variables

  var address = req.body.address;
  var user = req.body.user;

  // put the data in the database
  // pulling in mysql
  var mysql = require("mysql");

  // set up a connection
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "test",
    password: "",
  });

  con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
    var sql =
      "INSERT INTO `test`.`customerorders` (`address`) VALUES ('" +
      address +
      "');";
    console.log(sql);
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log(result.insertId);
      insertId = result.insertId;
      res.send("" + insertId);
    });
  });
});

app.post("/putInDatabase", function (req, res) {
  // catching the variables
  var username = req.body.username;
  var email = req.body.email;
  var pass = req.body.password;
  var acctype = req.body.acctype;

  // put the data in the database
  // pulling in mysql
  var mysql = require("mysql");

  // set up a connection
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "test",
    password: "",
  });

  con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
    var sql =
      "INSERT INTO `test`.`users` (`username`, `email`, `password`, `acctype`) VALUES ('" +
      username +
      "', '" +
      email +
      "', '" +
      pass +
      "', '" +
      acctype +
      "');";
    console.log(sql);
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("1 record inserted");
    });
  });
  res.send("Data went to the database");
});

app.get("/putInSession", function (req, res) {
  var cart = req.body.cart;

  req.session.cart = cart;

  res.send("all ok");
});

app.get("/checkIfTimeLeft", function (req, res) {
  var timeLeft = req.session.cookie.maxAge / 1000;
  console.log(timeLeft);

  if (timeLeft < 1) {
    res.send("expired");
  } else {
    res.send("ok");
  }
});

app.post("/completeCheckout", function (req, res) {
  // catching the variables
  var orderby = req.body.orderby;
  var items = req.body.items;
  var total = req.body.total;
  var orderId = req.body.orderId;

  // put the data in the database
  // pulling in mysql
  var mysql = require("mysql");

  // set up a connection
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "test",
    password: "",
  });

  con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
    var sql =
      "UPDATE `test`.`customerorders` SET `orderby`= '" +
      orderby +
      "', `items` = '" +
      items +
      "', `total` = '" +
      total +
      "' WHERE id= '" +
      orderId +
      "'";
    console.log(sql);
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("1 record inserted");
    });
  });
  res.send("Data went to the database");
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});
module.exports = app;
