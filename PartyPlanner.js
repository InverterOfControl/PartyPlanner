Items = new Mongo.Collection("items");
MissingItems = new Mongo.Collection("missingItems");

if (Meteor.isClient) {
  accountsUIBootstrap3.setLanguage('de');

  // This code only runs on the client
  Meteor.subscribe("items");

  Template.body.helpers({
    items: function () {
        // return all items
        return Items.find({}, {sort: {createdAt: -1}});
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
	
	"submit .new-missingItem": function(event){
		var text = event.target.text.value;
		
		Meteor.call("addMissingItem", text);
		
		// Clear form
		event.target.text.value = "";

		// Prevent default form submit
		return false;
	}
  });

  Template.item.events({
    "click .delete": function () {
      Meteor.call("deleteItem", this._id);
    },
  });

  Template.registerHelper('equals', function (a, b) {
      return a === b;
    });
  
  Template.item.helpers({
    isOwner: function () {
      return this.owner === Meteor.userId();
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  }); 
} else {
  Accounts.onCreateUser(function(options, user){
    // user registered via Facebook
    if(options.profile){
      user.username = options.profile.name;
      options.profile.picture = "http://graph.facebook.com/" + user.services.facebook.id + "/picture/?type=large";
      user.profile = options.profile;
    }

    return user;
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
  addMissingItem: function(text){
	  // Make sure the user is logged in before inserting a item
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    MissingItems.insert({
      text: text
    });
  }
});

if (Meteor.isServer) {
  Meteor.publish("items", function () {
    return Items.find();
  });
}