// jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const https = require("https");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const port = process.env.PORT || 3000;

const app = express();

// const newItems = [];
const workItems = [];

app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI);

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your ToDo List.",
});

const item2 = new Item({
  name: "Hit the + button to add new items.",
});

const item3 = new Item({
  name: "<-- Hit this to delete items.",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);
// const today = date.getDate();

app.get("/", (req, res) => {
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Documents added successfully to todolistDB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newItems: foundItems,
      });
    }
  });
});

app.get("/:customListName", (req, res) => {
  const listTitle = _.capitalize(req.params.customListName); 

  List.findOne({ name: listTitle }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: listTitle,
          items: defaultItems,
        });

        list.save();

        res.redirect("/" + listTitle);
      } else {
        // Show an existing list
        res.render("list", {
          listTitle: listTitle,
          newItems: foundList.items,
        });
      }
    } else {
      console.log(err);
    }
  });
});

app.post("/", (req, res) => {
  const newListItem = req.body.newItem;
  const listTitle = req.body.listType;

  const item = new Item({
    name: newListItem
  });

  if (listTitle === "Today") {
    Item.create({ name: newListItem }, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/");
      }
    });
  } else {
    List.findOne({ name: listTitle }, (err, foundList) => {
      if (err) {
        console.log(err);
      } else {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listTitle);
      }
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemID = req.body.checkbox;
  const listTitle = req.body.listTitle;

  if (listTitle === "Today") {
    Item.findByIdAndRemove(checkedItemID, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Item successfully deleted.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listTitle}, {$pull: {items: {_id: checkedItemID}}}, (err, foundList) => {
      if (!err) {
        res.redirect("/" + listTitle);
      }
    });
  }
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.listen(port, () => {
  console.log("Server is running on port " + port + ".");
});
