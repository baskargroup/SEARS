// Filter product based on solvent composition
exports = function() {
    const docs = context.services.get("mongodb-atlas").db("dope").collection("productData").find({}, {
        "_id": 1,
        "solvents": 1,
        "conductivity_format": 1,
        "annealing_temperature": 1
    }).toArray();
    return  docs;
};