var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  console.log("---------------------");
  console.log("/index page session is" + req.session.id);
  res.render("index", { title: "Express" });
});

module.exports = router;
