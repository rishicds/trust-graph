package middleware

import (
	"context"
	"net/http"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/trustgraph/backend/internal/config"
	"github.com/trustgraph/backend/internal/repository"
	"github.com/trustgraph/backend/internal/service/admin"
)

type adminContextKey string

const adminGitHubKey adminContextKey = "adminGitHub"

func RequireAdmin(cfg *config.Config, store *repository.Store) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := clerk.SessionClaimsFromContext(r.Context())
			if !ok {
				writeAuthError(w, http.StatusUnauthorized, "unauthorized")
				return
			}

			allowed, ghUser, err := admin.IsAuthorized(r.Context(), cfg, store, claims.Subject)
			if err != nil {
				writeAuthError(w, http.StatusBadGateway, "could not verify admin access")
				return
			}
			if !allowed {
				writeAuthError(w, http.StatusForbidden, "admin access required")
				return
			}

			ctx := context.WithValue(r.Context(), adminGitHubKey, ghUser)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func AdminGitHubFromContext(ctx context.Context) string {
	v, _ := ctx.Value(adminGitHubKey).(string)
	return v
}
