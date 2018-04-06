require('dotenv').config();

const 
    mongodb = require('mongodb')
    mongo = mongodb.MongoClient
  ;

let
    client
  , db
  , foodCollection
  , userDataCollection
  , pantryCollection
  ;

mongo.connect(process.env.DATABASE, function(err, connectedClient) {
  if (err) {
    console.error(err);
    process.exit(0);
    return;
  }

  client = connectedClient;
  db = client.db('NutritionPlan');
  foodCollection = db.collection('Food');
  userDataCollection = db.collection('UserData');
  pantryCollection = db.collection('Pantry');

  console.log('database connection success');
});

process.on('SIGINT', function() {
  client.close(() => {
    process.exit(0);
  });
});

const updateOne = (collection, query, update) => {
  return new Promise((rslv, rjct) => {
    collection.findOneAndUpdate(query, update, function(err, res) {
      if (err) {
        rjct(err);
        return;
      }

      if (res.lastErrorObject.updatedExisting == false) {
        rjct('Object not found');
        return;
      }

      rslv('success');
    });
  }).catch(err => {
    console.log(`update collection ${collection} error: ${err}`);
  });
}

//TODO: check collecitions initialized
//TODO: projection not working

/* Pantry */

exports.addToPantry = (userId, pantryObj) => {
  pantryObj.foodId = mongodb.ObjectId(pantryObj.foodId);
  
  return new Promise((rslv, rjct) => {
    userDataCollection.findOneAndUpdate({
      "_id": mongodb.ObjectId(userId),
      "pantry.foodId": {
        $nin: [ pantryObj.foodId ]
      }
    }, {
      $push: {
        "pantry": pantryObj
      }
    }, function(err, res) {
      if (err) {
        rjct(err);
        return;
      }

      if (res.lastErrorObject.updatedExisting == false) {
        rjct('Object not found to push into pantry or pantry already contains this oid');
        return;
      }

      rslv('success');
    })
  });
}

exports.removeFromPantry = (userId, foodId) => {
  return new Promise((rslv, rjct) => {
    userDataCollection.findOneAndUpdate({
      '_id': mongodb.ObjectId(userId)
    }, {
      $pull: {
        pantry: {
          foodId: mongodb.ObjectId(foodId)
        }
      }
    }, function(err, res) {
      if (err) {
        rjct(err);
        return;
      }

      if (res.lastErrorObject.updatedExisting == false) {
        rjct('Object not found to pull from pantry');
        return;
      }

      rslv('success');
    })
  });
}

/* Ration */
exports.setRation = (userId, rationObj) => {
  return new Promise((rslv, rjct) => {
    try {
      userDataCollection.updateOne(
        {
          '_id': mongodb.ObjectId(userId)
        }, {
          $set: {
            ration: rationObj
          }
        }, function(err, res) {
          if (err) {
            rjct(err);
            return;
          }
  
          rslv(res);
        }
      );
    }
    catch(err) {
      rjct(err);
    }
  });
}

exports.updateRation = (userId, foodIdStr, portion) => {
  const query = {
    "_id": mongodb.ObjectId(userId),
    "ration.food": foodIdStr
  }
  , update = {
    $set: {
      'ration.$.portion': portion
    }
  };

  return updateOne(userDataCollection, query, update);
}

exports.addToRation = (userId, rationObj) => {
  const query = {
    "_id": mongodb.ObjectId(userId),
  }
  , update = {
    $push: {
      'ration': rationObj
    }
  };

  return updateOne(userDataCollection, query, update); 
}


/* UserData */
exports.getIdealNutrition = (userId) => {
  return new Promise((rslv, rjct) => {
    userDataCollection.findOne(mongodb.ObjectId(userId), { nutrition: 1 }, function(err, doc) {
      if (err) {
        rjct(err);
        return;
      }

      rslv(doc.nutrition);
    });
  });
}

exports.setIdealNutrition = (userId, newNutrition) => {
  return new Promise((rslv, rjct) => {
    try {
      userDataCollection.updateOne({'_id': mongodb.ObjectId(userId)}, {
          $set: {
            nutrition: newNutrition
          }
        }, function(err, res) {
          if (err) {
            rjct(err);
            return;
          }

          rslv(res);
        }
      );
    }
    catch(err) {
      rjct(err);
    }
  })
}

exports.getUserInfo = (id, projection) => {
  return new Promise((rslv, rjct) => {
    userDataCollection.findOne(mongodb.ObjectId(id), projection, function(err, doc) {
      if (err) {
        rjct(err);
        return;
      }

      rslv(doc);
    });
  });
}

exports.food = () => {
  return foodCollection;
};

exports.user = () => {
  return userDataCollection;
}

exports.pantry = () => {
  return pantryCollection;
}