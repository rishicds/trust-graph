package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type NewsletterSubscriber struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Email     string             `bson:"email" json:"email"`
	Source    string             `bson:"source,omitempty" json:"source,omitempty"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
}
