// This function is used to fetch latest 30 experiments. Default view of the app.
exports = function() {
    const docs = context.services.get("mongodb-atlas").db("dope").collection("productData").find().sort({_id: -1} ).limit(30).toArray();
    return  docs;
};