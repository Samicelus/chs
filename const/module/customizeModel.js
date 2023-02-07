const  MONGO_DATA_TYPES = [
    "String",
    "Number",
    "Boolean",
    "Date",
    "ObjectId",
    "Object",
    "Array",
    "Mixed"
]

const DB_TYPES = [
    "mongodb",
    "mysql"
]

const METHODS = [
    "GET",
    "POST",
    "DELETE",
    "PUT",
    "PATCH",
    "HEAD",
    "SOAP"
]

const JOIN_TYPES = [
    "LEFT JOIN",
    "RIGHT JOIN",
    "INNER JOIN"
]

module.exports = {
    MONGO_DATA_TYPES,
    DB_TYPES,
    METHODS,
    JOIN_TYPES
}