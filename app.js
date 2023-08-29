const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const lodash = require("lodash");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");


mongoose.connect(
  "mongodb+srv://" +
    process.env.DB_USERNAME +
    ":" +
    process.env.DB_PASSWORD +
    "@test.ybcw5vb.mongodb.net/todoListDB"
);

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
});
const Item = mongoose.model("Item", itemSchema);
const item1 = new Item({
  name: "Add a task for today!",
});
const item2 = new Item({
  name: "Study",
});

const defaultItem = [item1, item2];

const listSChema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});
const List = mongoose.model("List", listSChema);

app.get("/", function (req, res) {
  Item.find()
    .then((result) => {
      if (result.length === 0) {
        Item.insertMany(defaultItem)
          .then((result) => {
            console.log(result);
          })
          .catch((err) => {
            console.log(err);
          });
        res.redirect("/");
      }
      res.render("list", { listTitle: "Today", newListItems: result });
    })
    .catch((err) => {
      console.log(err);
    });
});
app.get("/about", function (req, res) {
  res.render("about");
});
app.get("/:customListName", (req, res) => {
  const customListName = lodash.capitalize(req.params.customListName);
  List.findOne({ name: customListName }).then((result) => {
    if (!result) {
      console.log("not found");
      const list = new List({
        name: customListName,
        items: defaultItem,
      });
      list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", {
        listTitle: result.name,
        newListItems: result.items,
      });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then((result) => {
      result.items.push(item);
      result.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.deleteOne({ _id: checkedItemId })
      .then(() => {
        res.redirect("/");
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    ).then((result) => {
      res.redirect("/" + listName);
    });
  }
});

let port = process.env.PORT;
if (port == null || port == undefined) {
  port = 3000;
}
app.listen(port, function () {
  console.log("server listening on success");
});
