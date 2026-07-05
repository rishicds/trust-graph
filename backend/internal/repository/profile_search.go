package repository

import (
	"context"
	"time"

	"github.com/trustgraph/backend/internal/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (s *Store) RecordProfileSearch(ctx context.Context, event *models.ProfileSearchEvent) error {
	if event == nil {
		return nil
	}
	event.CreatedAt = time.Now().UTC()
	res, err := s.profileSearchEvents.InsertOne(ctx, event)
	if err != nil {
		return err
	}
	event.ID = res.InsertedID.(primitive.ObjectID)
	return nil
}
