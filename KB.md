#LAST HOUR
db.getCollection('users').find({"updated_time" : {$lt: new Date((new Date())-1000*60*60*1)}})