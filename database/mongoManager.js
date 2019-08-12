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
  , availableCollection
  ;

mongo.connect(process.env.DATABASE, { useNewUrlParser: true }, function(err, connectedClient) {
  if (err) {
    console.error(err);
    process.exit(0);
    return;
  }

  client = connectedClient;
  db = client.db(process.env.DATABASE_NAME);
  foodCollection = db.collection('Food');
  userDataCollection = db.collection('UserData');
  availableCollection = db.collection('Available');

  console.log('database connection success');
});

process.on('SIGINT', function() {
  client.close(() => {
    process.exit(0);
  });
});

exports.food = () => {
  return foodCollection;
};

exports.user = () => {
  return userDataCollection;
}

exports.available = () => {
  return availableCollection;
}