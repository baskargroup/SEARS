// Update product info using experiment id
exports = function(data) {
    data['user'] = context.user.data.email
    id = data['_id'];
    delete data._id;
    const doc = context.services.get("mongodb-atlas").db("dope").collection("productData").updateOne({_id: id}, {$set: data});
    return doc.valueOf();
};