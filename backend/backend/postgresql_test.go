package backend

import (
	"bytes"
	"context"
	"database/sql"
	"fmt"
	"testing"

	_ "github.com/lib/pq"
	sqlmock "gopkg.in/DATA-DOG/go-sqlmock.v2"
)

func TestGetAndSaveCommands(t *testing.T) {
	for _, tt := range []struct {
		name      string
		email     string
		googleKey string
		commands  []byte
	}{
		{
			name:      "can get a user's commands",
			email:     "a@b.com",
			googleKey: "first_key",
			commands:  []byte("This test doesn't need an actual command so we can put anything in there."),
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			p, mock, err := mockConnection()
			if err != nil {
				t.Fatal(err)
			}

			defer p.DB.Close()

			mock.ExpectExec(fmt.Sprintf("INSERT INTO %s", userTable)).WithArgs(tt.email, tt.googleKey).WillReturnResult(sqlmock.NewResult(1, 1))
			mock.ExpectExec(fmt.Sprintf("UPDATE %s SET commands", userTable)).WithArgs(tt.commands, tt.googleKey).WillReturnResult(sqlmock.NewResult(1, 1))
			rows := sqlmock.NewRows([]string{"command"}).AddRow(tt.commands)
			mock.ExpectQuery(fmt.Sprintf("SELECT commands FROM %s WHERE google_key", userTable)).WithArgs(tt.googleKey).WillReturnRows(rows)

			if err := p.upsertUser(context.Background(), tt.email, tt.googleKey); err != nil {
				t.Fatal(err)
			}

			if err := p.saveCommands(context.Background(), tt.googleKey, tt.commands); err != nil {
				t.Fatal(err)
			}

			got, err := p.getCommands(context.Background(), tt.googleKey)
			if err != nil {
				t.Fatal(err)
			}

			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}

			if !bytes.Equal(got, tt.commands) {
				t.Fatalf("got %q, want %q", got, tt.commands)
			}
		})
	}
}

func TestRegisterUser(t *testing.T) {
	for _, tt := range []struct {
		name  string
		email string
	}{
		{
			name:  "registers a new user",
			email: "a@b.com",
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			p, mock, err := mockConnection()
			if err != nil {
				t.Fatal(err)
			}

			defer p.DB.Close()

			rows1 := sqlmock.NewRows([]string{"email"}).AddRow(tt.email)
			mock.ExpectExec(fmt.Sprintf("INSERT INTO %s", userTable)).WithArgs(tt.email).WillReturnResult(sqlmock.NewResult(1, 1))
			mock.ExpectQuery(fmt.Sprintf("SELECT email FROM %s", userTable)).WithArgs(tt.email).WillReturnRows(rows1)

			if err := p.registerUser(context.Background(), tt.email); err != nil {
				t.Fatal(err)
			}

			var got1 string
			if err = p.DB.QueryRow(fmt.Sprintf(`SELECT email FROM %s WHERE email=$1`, userTable), tt.email).Scan(&got1); err != nil {
				t.Fatal(err)
			}

			if got1 != tt.email {
				t.Fatalf("got %+v, want %+v", got1, tt.email)
			}

			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}
		})
	}
}

func TestUpsertUser(t *testing.T) {
	for _, tt := range []struct {
		name       string
		email      string
		googleKey  string
		googleKey2 string
	}{
		{
			name:       "insert a new user and update their API Key",
			email:      "a@b.com",
			googleKey:  "first_key",
			googleKey2: "second_key",
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			p, mock, err := mockConnection()
			if err != nil {
				t.Fatal(err)
			}

			defer p.DB.Close()

			rows1 := sqlmock.NewRows([]string{"google_key"}).AddRow(tt.googleKey)
			mock.ExpectExec(fmt.Sprintf("INSERT INTO %s", userTable)).WithArgs(tt.email, tt.googleKey).WillReturnResult(sqlmock.NewResult(1, 1))
			mock.ExpectQuery(fmt.Sprintf("SELECT google_key FROM %s", userTable)).WithArgs(tt.email).WillReturnRows(rows1)

			// perhaps pass in a more comprehensive regexp that ensures the update statement was run?
			rows2 := sqlmock.NewRows([]string{"google_key"}).AddRow(tt.googleKey2)
			mock.ExpectExec(fmt.Sprintf("INSERT INTO %s", userTable)).WithArgs(tt.email, tt.googleKey2).WillReturnResult(sqlmock.NewResult(1, 1))
			mock.ExpectQuery(fmt.Sprintf("SELECT google_key FROM %s", userTable)).WithArgs(tt.email).WillReturnRows(rows2)

			if err := p.upsertUser(context.Background(), tt.email, tt.googleKey); err != nil {
				t.Fatal(err)
			}

			var got1 string
			if err = p.DB.QueryRow(fmt.Sprintf(`SELECT google_key FROM %s WHERE email=$1`, userTable), tt.email).Scan(&got1); err != nil {
				t.Fatal(err)
			}

			if got1 != tt.googleKey {
				t.Fatalf("got %+v, want %+v", got1, tt.googleKey)
			}

			// update their API Key
			if err := p.upsertUser(context.Background(), tt.email, tt.googleKey2); err != nil {
				t.Fatal(err)
			}

			// make sure their API Key updated
			var got2 string
			if err = p.DB.QueryRow(fmt.Sprintf(`SELECT google_key FROM %s WHERE email=$1`, userTable), tt.email).Scan(&got2); err != nil {
				t.Fatal(err)
			}

			if got2 != tt.googleKey2 {
				t.Fatalf("got %+v, want %+v", got2, tt.googleKey2)
			}

			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}
		})
	}
}

func TestSetup(t *testing.T) {
	p, mock, err := mockConnection()
	if err != nil {
		t.Fatal(err)
	}

	defer p.DB.Close()

	mock.ExpectExec("CREATE TABLE IF NOT EXISTS users").WillReturnResult(sqlmock.NewResult(1, 1))
	if err = p.Setup(); err != nil {
		t.Fatal(err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

func mockConnection() (p *PostgreSQL, mock sqlmock.Sqlmock, err error) {
	var db *sql.DB
	db, mock, err = sqlmock.New()
	if err != nil {
		return
	}

	p = &PostgreSQL{
		DB: db,
	}

	return
}
