// Creating a new product
exports = function(data) {
    data['user'] = context.user.data.email
    const doc = context.services.get("mongodb-atlas").db("dope").collection("productData").insertOne(data);
    return doc.valueOf();
};

