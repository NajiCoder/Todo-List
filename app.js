
const express = require("express");
const bodyParser = require("body-parser");
const _ = require('lodash');
const mongoose = require("mongoose");
// const date = require(__dirname + "/date.js");

const app = express();

// Initialize EJS
app.set('view engine', 'ejs');

// Initialise Body-parser 
app.use(bodyParser.urlencoded({extended: true}));
// Add the public folder for the static css
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

// Add connection to MongoDb Atlas
const dbConnectionString = require('./connections.js');

// Initialize Mongoose
mongoose.connect(dbConnectionString + "todolistDB");



// Create a todolist Items Scema
const itemsSchema = new mongoose.Schema({
  name: String
})

// Create a mMdel/Collection
const Item = mongoose.model("item", itemsSchema);

// Add Items to the collection
const item1 = new Item({
  name: "Welcom to your todoList"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<--- Hit this to remove an item>"
});

const defaultItems = [item1, item2, item3];

// Create a pages List Schema
const listSchema = new mongoose.Schema({
  name: String,
  items : [itemsSchema],
})

// create model/collection for the pages List Schema
const List = mongoose.model("list", listSchema)

// Render the home route page
app.get("/", async function(req, res) {

  // use Async and Await since mongoose does not support callback functions anymore
  try {
    const itemsList = await Item.find({});// Item.find returns an array of all items in a collection
    const itemListNames = itemsList.map((item) => item.name);
    // To make sure not add items to the db everytime the code runs, check if the collection is empty the insertMany
    if (itemsList.length === 0){
      Item.insertMany(defaultItems);
      // After insering the items into the db redirect to the home route, and the if part will be skipped as long the list is not empty
      res.redirect("/");
    }else{
      res.render("list", { listTitle: "Today", newListItems: itemsList });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Add any page that the user put using express params
app.get("/:newListName", async function(req, res){
  const requestedPgaeName = _.capitalize(req.params.newListName);
  console.log(requestedPgaeName);
  // console.log('test again');
  
  try {
    const listExist = await List.findOne({name: requestedPgaeName});
    if (!listExist){
      const list = new List({
        name: requestedPgaeName,
        items : defaultItems,
      });
      // console.log(`A list with this name:  '${requestedPgaeName}' has been created`);
      list.save();
      res.redirect("/" + requestedPgaeName);

    } else{
      res.render("list", { listTitle: listExist.name, newListItems: listExist.items });
      // console.log(`A list with the name:  '${requestedPgaeName}' already exist`);
    }
  } catch(err){
    console.log(err);
  }
})

// app.get("/:customListName",function(req,res){
//   const customListName = req.params.customListName;
//   console.log("test");
 
//   List.findOne({name:customListName})
//     .then(function(foundList){
        
//       if(!foundList){
//         const list = new List({
//           name:customListName,
//           items:defaultItems
//         });
      
//         list.save();
//         console.log("saved");
//         res.redirect("/"+customListName);
//       }
//       else{
//         res.render("list",{listTitle:foundList.name, newListItems:foundList.items});
//         console.log("exist");
//       }
//     })
//     .catch(function(err){});  
// })


// Cath the post request triggerd by the client
app.post("/", async function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item4 = new Item({
    name: itemName,
  })

  
  if (listName === "Today"){
    item4.save();
    res.redirect("/");
  } else{
      try {
        const foundList = await List.findOne({name: listName});
        foundList.items.push(item4);
        foundList.save();
        res.redirect("/"+ listName);
      } catch(err){
        console.log(err);
      }
     }
  



  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  //   res.redirect("/");
  // }
});

app.post("/delete", async function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    try {
      const result = await Item.findByIdAndDelete(checkedItemId);
      console.log(`An item with name '${result.name}' has been deleted`);
      res.redirect("/");
    } catch(err){
      console.error(err);
    }
  } else {
      try {
        const result = await List.findOneAndUpdate({name: listName}, {$pull: {items:{_id: checkedItemId}}});
        res.redirect("/" + listName);
      } catch(err){
        console.error(err);
      }
  } 

})


// app.get('/favicon.ico', (req, res) => res.status(204));

// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: ["hi", "hello"]});
// });

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
