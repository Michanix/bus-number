package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/gorilla/mux"
)

var (
	baseUrl = "/api/v1"
	port    = 8080
	addr    = fmt.Sprintf("localhost:%d", port)
)

type Route struct {
	RouteId   string    `json:"route_id"`
	AgencyId  int       `json:"agency_id"`
	ShortName string    `json:"short_name"`
	LongName  string    `json:"long_name"`
	Type      int       `json:"type"`
	Color     string    `json:"color"`
	Authority string    `json:"competent_authority"`
	Timestamp time.Time `json:"timestamp"`
}

func checkErr(err error) {
	if err != nil {
		log.Panic(err.Error())
	}
}

func dbConn() (db *sql.DB) {
	driver := "mysql"
	user := os.Getenv("DB_USER")
	pass := os.Getenv("DB_PASS")
	dbName := os.Getenv("DB_NAME")
	address := os.Getenv("DB_URL")
	dataSourceName := fmt.Sprintf(
		"%s:%s@tcp(%s)/%s?parseTime=true",
		user, pass, address, dbName)

	db, err := sql.Open(driver, dataSourceName)

	checkErr(err)
	db.SetConnMaxLifetime(time.Minute)
	db.SetMaxOpenConns(10)
	db.SetConnMaxIdleTime(10)
	return db
}

func setupCorsResponse(w *http.ResponseWriter, req *http.Request) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set(
		"Access-Control-Allow-Methods",
		"POST, GET, OPTIONS, PUT, DELETE")
	(*w).Header().Set(
		"Access-Control-Allow-Headers",
		"Accept, Content-Length, Authorization")
	(*w).Header().Set("Content-Type", "application/json")
}

func getColumnStringValues(query string) []string {
	result := []string{}
	db := dbConn()
	defer db.Close()

	rows, err := db.Query(query)

	checkErr(err)

	for rows.Next() {
		var value string
		rows.Scan(&value)
		result = append(result, value)
	}

	return result
}

func AllStopAreasHandler(w http.ResponseWriter, r *http.Request) {
	setupCorsResponse(&w, r)
	query := `
	SELECT DISTINCT stop_area
	FROM stops 
	WHERE stop_area <> ""
	ORDER BY stop_area ASC;`

	stopAreas := getColumnStringValues(query)
	areas, err := json.MarshalIndent(&stopAreas, "", "  ")
	checkErr(err)

	w.Write(areas)
}

func getRoutes(w http.ResponseWriter, r *http.Request) {
	db := dbConn()
	rows, err := db.Query("SELECT * FROM routes LIMIT 10;")

	checkErr(err)

	routes := []Route{}

	for rows.Next() {
		var agencyId, routeType int
		var routeId, shortName, longName string
		var color, authority string
		var timestamp time.Time

		rows.Scan(
			&routeId, &agencyId, &shortName, &longName, &routeType,
			&color, &authority, &timestamp)

		routes = append(
			routes,
			Route{routeId, agencyId, shortName, longName,
				routeType, color, authority, timestamp})
	}
	routesJson, err := json.MarshalIndent(&routes, "", "  ")

	checkErr(err)

	w.Write(routesJson)
	db.Close()
}

func AreaStopsHandler(w http.ResponseWriter, r *http.Request) {
	setupCorsResponse(&w, r)
	vars := mux.Vars(r)
	query := fmt.Sprintf(`
	SELECT DISTINCT stop_name 
	FROM stops 
	WHERE stop_area = '%s' 
	ORDER BY stop_name ASC;`, vars["name"])

	stopNames := getColumnStringValues(query)
	names, err := json.MarshalIndent(&stopNames, "", "  ")
	checkErr(err)

	w.Write(names)
}

func main() {
	router := mux.NewRouter()
	apiRouter := router.PathPrefix(baseUrl).Subrouter()
	apiRouter.HandleFunc("/stops/areas/", AllStopAreasHandler)
	apiRouter.HandleFunc("/stops/areas/{name}/names/", AreaStopsHandler)

	srv := &http.Server{
		Handler:      router,
		Addr:         addr,
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	// http.HandleFunc("/routes", getRoutes)
	// http.HandleFunc(baseUrl+"/stops/areas/", getAllStopAreas)
	log.Default().Printf("Starting server on http://%s/", addr)
	log.Fatal(srv.ListenAndServe())
}
