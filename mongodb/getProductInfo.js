// Finding experiment using experiment id or experiment name. User for search in app.
exports = function(keyword) {
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(keyword);

    const query = {
        $or: [
            { "experiment_name": { $regex: keyword, $options: "i" } }
        ]
    };

    if (isValidObjectId) {
        query.$or.push({ _id: new BSON.ObjectId(keyword) });
    }
    const docs = context.services.get("mongodb-atlas").db("dope").collection("productData").find(query);
    return  docs.toArray();
};
