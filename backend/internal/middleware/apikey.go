package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/trustgraph/backend/internal/repository"
)

const apiKeyHeader = "X-API-Key"

func APIKeyAuth(store *repository.Store) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			key := strings.TrimSpace(r.Header.Get(apiKeyHeader))
			if key == "" {
				auth := r.Header.Get("Authorization")
				if strings.HasPrefix(auth, "Bearer tg_") {
					key = strings.TrimPrefix(auth, "Bearer ")
				}
			}
			if key == "" {
				next.ServeHTTP(w, r)
				return
			}
			user, err := store.FindUserByAPIKey(r.Context(), key)
			if err != nil || user.Plan != "pro" {
				writeAuthError(w, http.StatusUnauthorized, "invalid api key")
				return
			}
			ctx := context.WithValue(r.Context(), userIDKey, user.ID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
