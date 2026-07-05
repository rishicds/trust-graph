package handlers

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func parseObjectID(hexID string) (primitive.ObjectID, error) {
	return primitive.ObjectIDFromHex(hexID)
}
