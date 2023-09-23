const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// connect to the database

mongoose.connect("mongodb://localhost:27017/todolistDB");

// database schema

const itemsSchema = {
  name: String,
};

//mongoose model
const Item = mongoose.model(
  //<"singularcollectionName">,
  "Item",
  //<schemaName>
  itemsSchema
);

// creating documents
const item1 = new Item({
  name: "pushup",
});
const item2 = new Item({
  name: "curl",
});
const item3 = new Item({
  name: "dip",
});

const defaultItems = [item1, item2, item3];

//

app.get("/", function (req, res) {
  let today = new Date();
  let options = {
    weekday: "long",
    day: "numeric",
    month: "long",
  };

  let day = today.toLocaleDateString("am", options);

  Item.find({})
    .then((foundItems) => {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(() => {
            console.log("success saved default to db");
          })
          .catch((err) => {
            console.error(err);
          });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: day, newListItems: foundItems });
      }
    })
    .catch((err) => {
      console.error(err);
    });
});

app.post("/", function (req, res) {
  let item = req.body.newItem;

  if (req.body.list === "work") {
    workItems.push(item);
    res.redirect("/work");
  } else {
    items.push(item);
    res.redirect("/");
  }
});

app.get("/work", function (req, res) {
  res.render("list", { listTitle: "WORK LIST", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("server is up on 3000");
});
