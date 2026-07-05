package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SalesInquiry struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CompanyName string             `bson:"company_name" json:"company_name"`
	Email       string             `bson:"email" json:"email"`
	Plan        string             `bson:"plan,omitempty" json:"plan,omitempty"`
	Source      string             `bson:"source,omitempty" json:"source,omitempty"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
}
