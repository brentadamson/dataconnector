package backend

import (
	"context"
	"database/sql"
	"fmt"
)

const (
	userTable = "users"
)

// PostgreSQL holds settings for a PostgreSQL database
type PostgreSQL struct {
	*sql.DB
}

func (p *PostgreSQL) registerUser(ctx context.Context, email string) (err error) {
	_, err = p.DB.ExecContext(ctx, fmt.Sprintf(`INSERT INTO %s (email, registered) VALUES ($1, CURRENT_TIMESTAMP) ON CONFLICT (email) DO UPDATE set updated=CURRENT_TIMESTAMP`, userTable), email)
	return
}

func (p *PostgreSQL) upsertUser(ctx context.Context, email, googleKey string) (err error) {
	_, err = p.DB.ExecContext(ctx, fmt.Sprintf(`INSERT INTO %s (email, google_key, registered) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (email) DO UPDATE set google_key=$2, updated=CURRENT_TIMESTAMP`, userTable), email, googleKey)
	return
}

func (p *PostgreSQL) getCommands(ctx context.Context, googleKey string) (encryptedCommands []byte, err error) {
	err = p.DB.QueryRowContext(ctx, fmt.Sprintf(`SELECT commands FROM %s WHERE google_key=$1 LIMIT 1`, userTable), googleKey).Scan(&encryptedCommands)
	switch err {
	case sql.ErrNoRows:
		err = errInvalidGoogleKey
	case nil:
	default:
	}

	return
}

func (p *PostgreSQL) saveCommands(ctx context.Context, googleKey string, encryptedCommands []byte) (err error) {
	result, err := p.DB.ExecContext(ctx, fmt.Sprintf(`UPDATE %s SET commands=$1 WHERE google_key=$2`, userTable), encryptedCommands, googleKey)
	if err != nil {
		return
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return
	}

	if rows != 1 {
		err = errInvalidGoogleKey
	}

	return
}

// Setup creates our tables
func (p *PostgreSQL) Setup() (err error) {
	stmt := fmt.Sprintf(`CREATE TABLE IF NOT EXISTS %s (pk serial PRIMARY KEY, email TEXT NOT NULL, google_key TEXT, commands BYTEA, registered TIMESTAMP WITH TIME ZONE, updated TIMESTAMP WITH TIME ZONE, UNIQUE(email), UNIQUE(google_key))`, userTable)
	_, err = p.DB.Exec(stmt)
	return
}
