// This function is used to pull all data from db.
exports = function() {
    const docs = context.services.get("mongodb-atlas").db("dope").collection("productData").find().toArray();
    return  docs;
};