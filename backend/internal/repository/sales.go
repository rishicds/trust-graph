package repository

import (
	"context"
	"strings"
	"time"

	"github.com/trustgraph/backend/internal/models"
)

func (s *Store) CreateSalesInquiry(ctx context.Context, companyName, email, plan, source string) error {
	_, err := s.salesInquiries.InsertOne(ctx, models.SalesInquiry{
		CompanyName: strings.TrimSpace(companyName),
		Email:       strings.ToLower(strings.TrimSpace(email)),
		Plan:        strings.TrimSpace(plan),
		Source:      strings.TrimSpace(source),
		CreatedAt:   time.Now().UTC(),
	})
	return err
}
