Items = new Mongo.Collection("items");

if (Meteor.isClient) {
  accountsUIBootstrap3.setLanguage('de');

  // This code only runs on the client
  Meteor.subscribe("items");

  Template.body.helpers({
    items: function () {
      if (Session.get("hideCompleted")) {
        // If hide completed is checked, filter items
        return Items.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
      } else {
        // Otherwise, return all of the items
        return Items.find({}, {sort: {createdAt: -1}});
      }
    },
    hideCompleted: function () {
      return Session.get("hideCompleted");
    },
    incompleteCount: function () {
      return Items.find({checked: {$ne: true}}).count();
    }
  });

  Template.body.events({
    "submit .new-item": function (event) {
      // This function is called when the new item form is submitted
      var text = event.target.text.value;

      Meteor.call("addItem", text);

      // Clear form
      event.target.text.value = "";

      // Prevent default form submit
      return false;
    },
    "change .hide-completed input": function (event) {
      Session.set("hideCompleted", event.target.checked);
    }
  });

  Template.item.events({
    "click .toggle-checked": function () {
      // Set the checked property to the opposite of its current value
      Meteor.call("setChecked", this._id, ! this.checked);
    },
    "click .delete": function () {
      Meteor.call("deleteItem", this._id);
    },
    "click .toggle-private": function () {
      Meteor.call("setPrivate", this._id, ! this.private);
    }
  });

  Template.item.helpers({
    isOwner: function () {
      return this.owner === Meteor.userId();
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });  
}

Meteor.methods({
  addItem: function (text) {
    // Make sure the user is logged in before inserting a item
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Items.insert({
      text: text,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },
  deleteItem: function (itemId) {
    var item = Items.findOne(itemId);
    if (item.private && item.owner !== Meteor.userId()) {
      // If the item is private, make sure only the owner can delete it
      throw new Meteor.Error("not-authorized");
    }

    Items.remove(itemId);
  },
  setChecked: function (itemId, setChecked) {
    var item = Items.findOne(itemId);
    if (item.private && item.owner !== Meteor.userId()) {
      // If the item is private, make sure only the owner can check it off
      throw new Meteor.Error("not-authorized");
    }

    Items.update(itemId, { $set: { checked: setChecked} });
  },
  setPrivate: function (itemId, setToPrivate) {
    var item = Items.findOne(itemId);

    // Make sure only the item owner can make a item private
    if (item.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Items.update(itemId, { $set: { private: setToPrivate } });
  }


});

if (Meteor.isServer) {
  // Only publish items that are public or belong to the current user
  Meteor.publish("items", function () {
    return Items.find({
      $or: [
        { private: {$ne: true} },
        { owner: this.userId }
      ]
    });
  });
}