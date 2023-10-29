// Import necessary libraries
const express = require("express"); // Express.js framework
const bodyParser = require("body-parser"); // Middleware for parsing request bodies
const mongoose = require("mongoose"); // MongoDB ODM (Object Data Modeling)
const date = require(__dirname + "/date.js"); // Custom date module

// Create an Express application
const app = express();

// Set the view engine to EJS (Embedded JavaScript templates)
app.set("view engine", "ejs");

// Configure middleware for parsing request bodies
app.use(bodyParser.urlencoded({ extended: true }));


// Serve static files from the "public" directory
app.use(express.static("public"));

// Connect to the MongoDB database
mongoose.connect("mongodb://localhost:27017/todolistDB");

// Define a schema for items in the database
const itemsSchema = {
  name: String,
};

// Create a Mongoose model for items using the schema
const Item = mongoose.model("Item", itemsSchema);

// Create default items for the to-do list
const item1 = new Item({
  name: "ADD LIST",
});
const item2 = new Item({
  name: "REMOVE LIST",
});
const item3 = new Item({
  name: "HIT THE + TO ADD",
});

const defaultItems = [item1, item2, item3];

// Define a schema for lists that contain items
const listSchema = {
  name: String,
  items: [itemsSchema],
};

// Create a Mongoose model for lists using the list schema
const List = mongoose.model("List", listSchema);

// Handle the root URL ("/") GET request
app.get("/", function (req, res) {
  // Get the current date for rendering
  let today = new Date();
  let options = {
    weekday: "long",
    day: "numeric",
    month: "long",
  };
  let day = today.toLocaleDateString("am", options);

  // Find all items in the database
  Item.find({})
    .then((foundItems) => {
      if (foundItems.length === 0) {
        // If there are no items, insert the default items and redirect
        Item.insertMany(defaultItems)
          .then(() => {
            console.log("success saved default to db");
          })
          .catch((err) => {
            console.error(err);
          });
        res.redirect("/");
      } else {
        // Render the "list" template with the found items
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    })
    .catch((err) => {
      console.error(err);
    });
});

// Handle custom list names in the URL
app.get("/:customListName", function (req, res) {
  const customListName = req.params.customListName;

  // Find a list with the given name in the database
  List.findOne({ name: customListName })
    .then((foundList) => {
      if (!foundList) {
        // If the list does not exist, create a new list with default items
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        list.save();

        res.redirect("/" + customListName);
      } else {
        // Render the "list" template with the found list's items
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    })
    .catch((err) => {
      console.error(err);
    });
});

// Handle POST requests to add new items to lists
app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName == "Today") {
    // If adding to the "Today" list, save the item and redirect to the root
    await item.save();
    res.redirect("/");
  } else {
    try {
      // If adding to a custom list, find the list and add the item
      const foundList = await List.findOne({ name: listName });
      foundList.items.push(item);
      await foundList.save();
      res.redirect("/" + listName);
    } catch (err) {
      console.error(err);
      res.status(500).send("An error occurred.");
    }
  }
});

// Handle POST requests to delete items from lists
app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    // If deleting from the "Today" list, find and remove the item
    Item.findByIdAndRemove(checkedItemId)
      .then(() => {
        console.log("deleted");
        res.redirect("/");
      })
      .catch((err) => {
        console.log("not deleted", err);
      });
  } else {
    // If deleting from a custom list, find the list and pull the item from the array
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then((foundList) => {
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log("Error:", err);
      });
  }
});

// Handle requests to the "/work" URL
app.get("/work", function (req, res) {
  res.render("list", { listTitle: "WORK LIST", newListItems: workItems });
});

// Handle requests to the "/about" URL
app.get("/about", function (req, res) {
  res.render("about");
});

// Start the server on port 3000
app.listen(3000, function () {
  console.log("server is up on 3000");
});
