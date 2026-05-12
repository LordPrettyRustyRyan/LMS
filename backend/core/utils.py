from bson import ObjectId

def serialize_doc(doc):
    new_doc = {}

    for key, value in doc.items():
        if isinstance(value, ObjectId):
            new_doc[key] = str(value)

        elif isinstance(value, list):
            new_doc[key] = [
                str(item) if isinstance(item, ObjectId) else item
                for item in value
            ]

        else:
            new_doc[key] = value

    return new_doc