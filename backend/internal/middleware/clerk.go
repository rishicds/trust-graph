package middleware

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/clerk/clerk-sdk-go/v2"
	clerkhttp "github.com/clerk/clerk-sdk-go/v2/http"
	"github.com/trustgraph/backend/internal/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type contextKey string

const userIDKey contextKey = "userID"
const clerkIDKey contextKey = "clerkID"

func withUserID(ctx context.Context, id primitive.ObjectID) context.Context {
	return context.WithValue(ctx, userIDKey, id)
}

func ClerkAuth() func(http.Handler) http.Handler {
	return clerkhttp.RequireHeaderAuthorization()
}

func ResolveClerkUser(store *repository.Store) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := clerk.SessionClaimsFromContext(r.Context())
			if !ok {
				writeAuthError(w, http.StatusUnauthorized, "unauthorized")
				return
			}

			user, err := store.FindUserByClerkID(r.Context(), claims.Subject)
			if err != nil {
				writeAuthError(w, http.StatusUnauthorized, "account not synced — call /v1/auth/clerk/sync first")
				return
			}

			ctx := withUserID(r.Context(), user.ID)
			ctx = context.WithValue(ctx, clerkIDKey, claims.Subject)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func OptionalResolveClerkUser(store *repository.Store) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := clerk.SessionClaimsFromContext(r.Context())
			if !ok {
				next.ServeHTTP(w, r)
				return
			}

			user, err := store.FindUserByClerkID(r.Context(), claims.Subject)
			if err != nil {
				next.ServeHTTP(w, r)
				return
			}

			ctx := withUserID(r.Context(), user.ID)
			ctx = context.WithValue(ctx, clerkIDKey, claims.Subject)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func OptionalClerkAuth() func(http.Handler) http.Handler {
	return clerkhttp.WithHeaderAuthorization()
}

func UserIDFromContext(ctx context.Context) (primitive.ObjectID, bool) {
	id, ok := ctx.Value(userIDKey).(primitive.ObjectID)
	return id, ok
}

func writeAuthError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}
