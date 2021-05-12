package main

import (
	"database/sql"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/brentadamson/dataconnector/backend"
	"github.com/brentadamson/dataconnector/crypto"
	"github.com/brentadamson/dataconnector/log"

	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
	"github.com/spf13/viper"
)

func main() {
	v := viper.New()
	v.SetEnvPrefix("dataconnector")
	v.AutomaticEnv()
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.SetTypeByDefaultValue(true)
	setDefaults(v)

	db, err := sql.Open("postgres",
		fmt.Sprintf(
			"user=%s password=%s host=%s database=%s port=%s sslmode=disable",
			v.GetString("postgresql.user"),
			v.GetString("postgresql.password"),
			v.GetString("postgresql.host"),
			v.GetString("postgresql.database"),
			v.GetString("postgresql.port"),
		),
	)
	if err != nil {
		log.Info.Fatalln(err)
	}

	defer db.Close()
	db.SetMaxOpenConns(950) // Should be lower than that found in /etc/postgresql/12/main/postgresql.conf
	db.SetMaxIdleConns(1)   // Should always be less than or equal to MaxOpenConns

	encryptionKey, err := hex.DecodeString(v.GetString("encryption.key"))
	if err != nil {
		log.Info.Fatalf("AES encryption key is invalid: %v\nPlease refer to: https://github.com/gtank/cryptopasta/blob/master/encrypt.go\nTo generate a new key, use NewEncryptionKey(), then hex.EncodeToString(key[:]).", err)
	}

	aes := &crypto.AES{}
	copy(aes.EncryptionKey[:], encryptionKey)

	cfg := &backend.Config{
		Backender: &backend.PostgreSQL{DB: db},
		Encrypt:   aes.Encrypt,
		Decrypt:   aes.Decrypt,
		JWTSecret: v.GetString("jwt.secret"),
	}

	if err := cfg.Backender.Setup(); err != nil {
		log.Info.Fatalf("unable to setup database: %v\n", err)
	}

	router := mux.NewRouter().StrictSlash(true)
	router.NewRoute().Name("update_google_key").Methods("POST").Path("/update_google_key").Handler(
		backend.AppHandler(cfg.UpdateGoogleKeyHandler),
	)
	router.NewRoute().Name("get").Methods("GET").Path("/get").Handler(
		backend.AppHandler(cfg.GetHandler),
	)
	router.NewRoute().Name("run").Methods("POST").Path("/run").Handler(
		backend.AppHandler(cfg.RunHandler),
	)
	router.NewRoute().Name("save").Methods("POST").Path("/save").Handler(
		backend.AppHandler(cfg.SaveHandler),
	)

	s := &http.Server{
		Addr:    ":8000",
		Handler: http.TimeoutHandler(router, 30*time.Second, "Timeout"),
	}

	log.Info.Printf("Listening at http://127.0.0.1%v", s.Addr)
	log.Info.Fatal(s.ListenAndServe())
}

func setDefaults(v *viper.Viper) {
	v.SetDefault("encryption.key", "")
	v.SetDefault("port", 8000)
}
