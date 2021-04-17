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

	db, err2 := sql.Open(driver, dataSourceName)

	checkErr(err2)
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
		"Accept, Content-Type, Content-Length, Authorization")
}

func getAllStopAres(w http.ResponseWriter, r *http.Request) {
	setupCorsResponse(&w, r)
	db := dbConn()
	rows, err := db.Query(`
	SELECT DISTINCT stop_area
	FROM stops 
	WHERE stop_area <> ""
	ORDER BY stop_area ASC;`)

	checkErr(err)

	stopAreas := []string{}

	for rows.Next() {
		var area string
		rows.Scan(&area)
		stopAreas = append(stopAreas, area)
	}

	areas, err := json.MarshalIndent(&stopAreas, "", "  ")
	checkErr(err)

	w.Write(areas)
	db.Close()
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

func main() {
	http.HandleFunc("/routes", getRoutes)
	http.HandleFunc("/stopAreas", getAllStopAres)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
